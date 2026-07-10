import { prisma } from '../prisma.js';

export async function logAdminAction(adminEmail: string, action: string, details?: string) {
    try {
        await prisma.qhubAdminLog.create({
            data: {
                adminEmail,
                action,
                details
            }
        });
    } catch (err) {
        console.error('Failed to log admin action', err);
    }
}
