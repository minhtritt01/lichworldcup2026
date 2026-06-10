import { z } from "zod";

export const WorkerMatchSchema = z.object({
  match_id: z.string(),
  match_number: z.number().int().default(0),
  stage: z.string().default("Vòng Bảng"),
  kickoff_time: z.string(),
  stadium: z.string(),
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
  incidents: z
    .array(
      z.object({
        incident_id: z.string(),
        time_minute: z.number().int(),
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
      }),
    )
    .default([]),
});

export type WorkerMatch = z.infer<typeof WorkerMatchSchema>;
