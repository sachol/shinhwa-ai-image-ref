import { Job, JobStatus } from '../types';

// In-memory "database" to store jobs
const jobStore: Map<string, Job> = new Map();

const generateUniqueId = (): string => {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Simulates creating a new image generation job
export const generateImage = (prompt: string, srefUrl: string): Promise<Job> => {
    return new Promise((resolve) => {
        const newJob: Job = {
            id: generateUniqueId(),
            prompt,
            srefUrl,
            status: JobStatus.Pending,
            createdAt: new Date(),
        };

        jobStore.set(newJob.id, newJob);

        // Simulate the backend worker picking up the job after a short delay
        setTimeout(() => {
            const job = jobStore.get(newJob.id);
            if (job) {
                job.status = JobStatus.Processing;
                jobStore.set(job.id, job);
            }
        }, 2000);

        // Simulate the image generation process completion
        setTimeout(() => {
            const job = jobStore.get(newJob.id);
            if (job) {
                // Randomly decide if the job succeeds or fails
                const didSucceed = Math.random() > 0.15; // 85% success rate
                if (didSucceed) {
                    job.status = JobStatus.Completed;

                    // The combined prompt (user prompt + style keywords) is used to search for a relevant image.
                    // This provides a much better simulation that reflects the user's input.
                    const keywords = job.prompt
                        .split(',')
                        .map(k => k.trim())
                        .filter(k => k.length > 0)
                        .join(',');
                    
                    const encodedKeywords = encodeURIComponent(keywords);

                    // Use Unsplash to fetch an image that matches the keywords from the prompt.
                    job.resultImageUrl = `https://source.unsplash.com/512x512/?${encodedKeywords}`;
                } else {
                    job.status = JobStatus.Failed;
                }
                jobStore.set(job.id, job);
            }
        }, 10000 + Math.random() * 5000); // Takes 10-15 seconds

        // Immediately return the job with pending status
        setTimeout(() => resolve(newJob), 500);
    });
};

// Simulates fetching the status of an existing job
export const getJobStatus = (jobId: string): Promise<Job> => {
    return new Promise((resolve, reject) => {
        const job = jobStore.get(jobId);
        setTimeout(() => {
            if (job) {
                resolve(job);
            } else {
                reject(new Error('Job not found'));
            }
        }, 300);
    });
};
