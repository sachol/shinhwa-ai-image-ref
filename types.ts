
export enum JobStatus {
    Pending = 'Pending',
    Processing = 'Processing',
    Completed = 'Completed',
    Failed = 'Failed',
}

export interface Job {
    id: string;
    prompt: string;
    srefUrl: string;
    status: JobStatus;
    resultImageUrl?: string;
    createdAt: Date;
}
