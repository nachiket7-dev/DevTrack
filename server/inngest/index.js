import { Inngest } from "inngest";
import prisma from "../configs/prisma.js"; 
import transporter from "../configs/nodemailer.js"; 

// Load environment variables
const inngestEventKey = process.env.INNGEST_EVENT_KEY;
const inngestSigningKey = process.env.INNGEST_SIGNING_KEY;

// Check if Inngest keys are missing
if (!inngestEventKey || !inngestSigningKey) {
    console.warn("Inngest keys are missing. Inngest functions will not be executed.");
}

// Initialize Inngest client
export const inngest = new Inngest({
    id: "my-backend-app", // Unique App ID
    name: "My Backend App",
    eventKey: inngestEventKey,
    signingKey: inngestSigningKey,
});

// Inngest functions
const syncUserCreation = inngest.createFunction(
    { id: "create-user-with-clerk" },
    { event: "clerk/user.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: `${data?.first_name} ${data?.last_name}`,
                image: data?.image_url,
            },
        });
        console.log(`User with ID ${data.id} created successfully.`);
    }
);

const syncUserDeletion = inngest.createFunction(
    { id: "delete-user-with-clerk" },
    { event: "clerk/user.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.delete({
            where: {
                id: data.id,
            },
        });
        console.log(`User with ID ${data.id} deleted successfully.`);
    }
);

const syncUserUpdation = inngest.createFunction(
    { id: "update-user-from-clerk" },
    { event: "clerk/user.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: `${data?.first_name} ${data?.last_name}`,
                image: data?.image_url,
            },
        });
        console.log(`User with ID ${data.id} updated successfully.`);
    }
);

// Workspace Functions
const syncWorkspaceCreation = inngest.createFunction(
    { id: "create-workspace-from-clerk" },
    { event: "clerk/organization.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.create({
            data: {
                id: data.id,
                name: data.name,
                slug: data.slug,
                image_url: data.image_url || "",
                ownerId: data.created_by,
            },
        });
        console.log(`Workspace ${data.id} created successfully.`);
    }
);

const syncWorkspaceUpdation = inngest.createFunction(
    { id: "update-workspace-from-clerk" },
    { event: "clerk/organization.updated" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.update({
            where: { id: data.id },
            data: {
                name: data.name,
                slug: data.slug,
                image_url: data.image_url || "",
            },
        });
        console.log(`Workspace ${data.id} updated successfully.`);
    }
);

const syncWorkspaceDeletion = inngest.createFunction(
    { id: "delete-workspace-from-clerk" },
    { event: "clerk/organization.deleted" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspace.delete({
            where: { id: data.id },
        });
        console.log(`Workspace ${data.id} deleted successfully.`);
    }
);

const syncWorkspaceMemberCreation = inngest.createFunction(
    { id: "create-workspace-member-from-clerk" },
    { event: "clerk/organizationMembership.created" },
    async ({ event }) => {
        const { data } = event;
        await prisma.workspaceMember.create({
            data: {
                id: data.id,
                workspaceId: data.organization.id,
                userId: data.public_user_data.user_id,
                role: data.role === "org:admin" ? "ADMIN" : "MEMBER",
            },
        });
        console.log(`Member added to workspace ${data.organization.id} successfully.`);
    }
);

const sendTaskAssignmentEmail = inngest.createFunction(
    { id: "send-task-assignment-mail" },
    { event: "app/task.assigned" },
    async ({ event }) => {
        const { taskId, origin } = event.data;

        // Fetch task details
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignee: true, project: { include: { workspace: true } } },
        });

        if (!task || !task.assignee) {
            console.log(`Task ${taskId} or assignee not found. Skipping email.`);
            return;
        }

        const emailHtml = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
                <h2 style="color: #333; text-align: center;">New Task Assigned</h2>
                <p style="color: #555; line-height: 1.6;">Hello <strong style="color: #000;">${task.assignee.name}</strong>,</p>
                <p style="color: #555; line-height: 1.6;">You have been assigned a new task in the <strong>${task.project.name}</strong> project within the <strong>${task.project.workspace.name}</strong> workspace.</p>
                
                <div style="background-color: #fff; padding: 15px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin: 20px 0;">
                    <h3 style="color: #007bff; margin-top: 0;">${task.title}</h3>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Description:</strong></p>
                    <p style="color: #444; background-color: #f1f1f1; padding: 10px; border-radius: 4px; margin-top: 0;">${task.description || "No description provided."}</p>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Priority:</strong> <span style="color: ${task.priority === 'High' ? 'red' : 'green'}; font-weight: bold;">${task.priority}</span></p>
                    <p style="color: #666; margin-bottom: 5px;"><strong>Due Date:</strong> ${task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date'}</p>
                </div>

                <div style="text-align: center; margin-top: 30px;">
                    <a href="${origin}/workspace/${task.project.workspace.id}/project/${task.project.id}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">View Task</a>
                </div>
                
                <p style="color: #999; font-size: 12px; text-align: center; margin-top: 30px;">This is an automated message. Please do not reply.</p>
            </div>
        `;

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: task.assignee.email,
            subject: `New Task Assignment: ${task.title}`,
            html: emailHtml,
        };

        try {
            await transporter.sendMail(mailOptions);
            console.log(`Task assignment email sent to ${task.assignee.email}`);
        } catch (error) {
            console.error("Error sending task assignment email:", error);
            throw error; // Rethrow to allow Inngest to retry
        }
    }
);

// Export Inngest functions
export const functions = [
    syncUserCreation,
    syncUserDeletion,
    syncUserUpdation,
    syncWorkspaceCreation,
    syncWorkspaceUpdation,
    syncWorkspaceDeletion,
    syncWorkspaceMemberCreation,
    sendTaskAssignmentEmail
];

