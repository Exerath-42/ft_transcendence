export default function formatDate(dateFromPrisma: Date): string {
    const date = new Date(dateFromPrisma);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}
