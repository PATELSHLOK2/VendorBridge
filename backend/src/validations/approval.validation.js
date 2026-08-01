import { z } from "zod";

export const approvalActionSchema = z.object({
  approvalId: z.string().min(1),
  remarks: z.string().optional(),
});
