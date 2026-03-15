import OpenAI from 'openai';
import { config } from '../config/index.js';

const client = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: config.github.token,
});

const MODEL = 'gpt-4o-mini';

async function callAI(prompt: string, maxTokens = 500): Promise<string> {
  const response = await client.chat.completions.create({
    model: MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });

  return response.choices[0]?.message?.content?.trim() || '';
}

export async function calculateMatchPercentage(
  bountyTitle: string,
  bountyDescription: string,
  bountyCategory: string,
  studentSkills: string[],
  studentRating: number,
  studentCompletedProjects: number
): Promise<{ percentage: number; reason: string }> {
  const prompt = `You are an AI matching engine for a freelance platform. Analyze how well a student freelancer matches a project.

Project:
- Title: "${bountyTitle}"
- Category: ${bountyCategory}
- Description: "${bountyDescription}"

Student Profile:
- Skills: ${studentSkills.join(', ') || 'No skills listed'}
- Rating: ${studentRating}/5
- Completed Projects: ${studentCompletedProjects}

Calculate a match percentage (0-100) based on:
- Skill relevance to the project (50% weight)
- Experience level from completed projects (25% weight)
- Rating/reliability (25% weight)

Respond ONLY with valid JSON in this exact format, no markdown:
{"percentage": <number>, "reason": "<one brief sentence explaining the match>"}`;

  const text = await callAI(prompt);

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      percentage: Math.min(100, Math.max(0, Math.round(parsed.percentage))),
      reason: parsed.reason || 'Match calculated based on skills and experience.',
    };
  } catch {
    return { percentage: 50, reason: 'Unable to calculate precise match.' };
  }
}

export interface BidderProfile {
  studentId: string;
  name: string;
  skills: string[];
  rating: number;
  completedProjects: number;
  bidPrice: number;
  bidMessage: string;
  avgReviewRating: number;
  reviewCount: number;
}

export async function findBestMatch(
  bountyTitle: string,
  bountyDescription: string,
  bountyCategory: string,
  bountyBudget: number,
  bidders: BidderProfile[]
): Promise<{ rankings: Array<{ studentId: string; percentage: number; reason: string }>; bestMatchId: string }> {
  const biddersText = bidders.map((b, i) => `
Bidder ${i + 1} (ID: ${b.studentId}):
- Name: ${b.name}
- Skills: ${b.skills.join(', ') || 'No skills listed'}
- Rating: ${b.rating}/5
- Completed Projects: ${b.completedProjects}
- Review Rating: ${b.avgReviewRating}/5 (${b.reviewCount} reviews)
- Bid Price: ₹${b.bidPrice}
- Bid Message: "${b.bidMessage}"`).join('\n');

  const prompt = `You are an AI matching engine for a freelance platform. A founder posted a bounty and multiple students have bid. Rank ALL bidders by how well they match.

Project:
- Title: "${bountyTitle}"
- Category: ${bountyCategory}
- Description: "${bountyDescription}"
- Budget: ₹${bountyBudget}

Bidders:
${biddersText}

Rank each bidder with a match percentage (0-100) based on:
- Skill relevance to the project (40% weight)
- Experience from completed projects (20% weight)
- Rating and reviews (20% weight)
- Bid price competitiveness relative to budget (10% weight)
- Quality of bid message (10% weight)

Respond ONLY with valid JSON array, no markdown, in this exact format:
[{"studentId": "<id>", "percentage": <number>, "reason": "<one brief sentence>"}]

Sort from highest to lowest percentage. Include ALL bidders.`;

  const text = await callAI(prompt, 1000);

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as Array<{ studentId: string; percentage: number; reason: string }>;
    const rankings = parsed.map(r => ({
      studentId: r.studentId,
      percentage: Math.min(100, Math.max(0, Math.round(r.percentage))),
      reason: r.reason || 'Ranked based on skills and experience.',
    }));
    const bestMatchId = rankings.length > 0 ? rankings[0].studentId : '';
    return { rankings, bestMatchId };
  } catch {
    // Fallback: return all bidders with 50%
    const rankings = bidders.map(b => ({
      studentId: b.studentId,
      percentage: 50,
      reason: 'Unable to calculate precise ranking.',
    }));
    return { rankings, bestMatchId: bidders[0]?.studentId || '' };
  }
}
