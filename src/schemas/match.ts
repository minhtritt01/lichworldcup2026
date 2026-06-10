import { z } from "zod";

export const MatchIncidentSchema = z.object({
  incident_id: z.string(),
  time_minute: z.number().int(),
  time_extra: z.number().int().optional(),
  team_id: z.string(),
  player_name: z.string(),
  type: z.enum([
    "Goal",
    "OwnGoal",
    "PenaltyGoal",
    "YellowCard",
    "RedCard",
    "Substitution",
    "VAR_Cancelled",
  ]),
});

export const MatchSchema = z.object({
  match_id: z.string(),
  match_number: z.number().int().default(0),
  stage: z.string().default("Vòng Bảng"),
  kickoff_time: z.string(),
  stadium: z.string().default("Sân vận động World Cup 2026"),
  status: z
    .enum(["Scheduled", "In_Play", "Half_Time", "Finished", "Postponed"])
    .default("Scheduled"),
  current_minute: z.number().int().default(0),
  home_team: z.object({
    team_id: z.string(),
    name: z.string(),
    name_vi: z.string(),
    slug: z.string(),
    score: z.number().int().default(0),
  }),
  away_team: z.object({
    team_id: z.string(),
    name: z.string(),
    name_vi: z.string(),
    slug: z.string(),
    score: z.number().int().default(0),
  }),
  statistics: z
    .object({
      possession_pct: z.object({
        home: z.number().default(50),
        away: z.number().default(50),
      }),
      shots_total: z.object({
        home: z.number().default(0),
        away: z.number().default(0),
      }),
      shots_on_target: z.object({
        home: z.number().default(0),
        away: z.number().default(0),
      }),
    })
    .optional(),
  incidents: z.array(MatchIncidentSchema).default([]),
});

export type Match = z.infer<typeof MatchSchema>;
