import { Request, Response } from 'express';
import prisma from '../config/db.js';
import {
  calculateMatchPercentage,
  findBestMatch,
} from '../services/ai.js';
import type { BidderProfile } from '../services/ai.js';

function getAiErrorMessage(err: any): string {
  const msg = err?.message || '';
  const status = err?.status || err?.statusCode || 0;
  if (status === 429 || msg.includes('429') || msg.includes('rate')) return 'AI rate limit hit. Please wait a moment and try again.';
  if (status === 401 || msg.includes('401') || msg.includes('auth')) return 'Invalid GitHub token. Check your GITHUB_TOKEN in .env.';
  if (status === 403 || msg.includes('403')) return 'GitHub token lacks permissions. Ensure it has access to GitHub Models.';
  return 'AI service temporarily unavailable. Please try again.';
}

// POST /api/ai/match-percentage
export async function aiMatchPercentage(req: Request, res: Response): Promise<void> {
  try {
    const { bountyId } = req.body;
    const userId = req.user!.userId;

    if (!bountyId) {
      res.status(400).json({ error: 'bountyId is required' });
      return;
    }

    const [bounty, user, completedCount] = await Promise.all([
      prisma.bounty.findUnique({ where: { id: bountyId } }),
      prisma.user.findUnique({
        where: { id: userId },
        select: { skills: true, rating: true },
      }),
      prisma.bounty.count({
        where: { claimedById: userId, status: 'COMPLETED' },
      }),
    ]);

    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const result = await calculateMatchPercentage(
      bounty.title,
      bounty.description,
      bounty.category || 'Miscellaneous',
      user.skills || [],
      Number(user.rating) || 0,
      completedCount
    );

    res.json(result);
  } catch (err) {
    console.error('[aiMatchPercentage]', err);
    res.status(500).json({ error: getAiErrorMessage(err) });
  }
}

// POST /api/ai/best-match
export async function aiBestMatch(req: Request, res: Response): Promise<void> {
  try {
    const { bountyId } = req.body;

    if (!bountyId) {
      res.status(400).json({ error: 'bountyId is required' });
      return;
    }

    const bounty = await prisma.bounty.findUnique({
      where: { id: bountyId },
      include: {
        bids: {
          include: {
            student: { select: { id: true, name: true, skills: true, rating: true } },
          },
        },
      },
    });

    if (!bounty) {
      res.status(404).json({ error: 'Bounty not found' });
      return;
    }

    if (bounty.bids.length === 0) {
      res.status(400).json({ error: 'No bids to analyze' });
      return;
    }

    // Fetch completed project counts and review data for each bidder
    const bidderProfiles: BidderProfile[] = await Promise.all(
      bounty.bids.map(async (bid) => {
        const [completedCount, reviews] = await Promise.all([
          prisma.bounty.count({
            where: { claimedById: bid.studentId, status: 'COMPLETED' },
          }),
          prisma.bountyFeedback.findMany({
            where: {
              bounty: { claimedById: bid.studentId },
              rating: { not: null },
            },
            select: { rating: true },
          }),
        ]);

        const avgReviewRating = reviews.length > 0
          ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length
          : 0;

        return {
          studentId: bid.studentId,
          name: bid.student.name,
          skills: bid.student.skills || [],
          rating: Number(bid.student.rating) || 0,
          completedProjects: completedCount,
          bidPrice: Number(bid.bidPrice),
          bidMessage: bid.message || '',
          avgReviewRating: Math.round(avgReviewRating * 10) / 10,
          reviewCount: reviews.length,
        };
      })
    );

    const result = await findBestMatch(
      bounty.title,
      bounty.description,
      bounty.category || 'Miscellaneous',
      Number(bounty.price),
      bidderProfiles
    );

    res.json(result);
  } catch (err) {
    console.error('[aiBestMatch]', err);
    res.status(500).json({ error: getAiErrorMessage(err) });
  }
}
