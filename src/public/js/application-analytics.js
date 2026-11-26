
function calculateApplicationAnalytics(applications) {
    const summary = {
        total: applications.length,
        underReview: 0,
        interviews: 0,
        offers: 0,
        monthlyCounts: {}
    };

    applications.forEach(app => {
        if (app.status === 'under_review') {
            summary.underReview++;
        }

        if (app.status === 'interview') {
            summary.interviews++;
        }

        if (app.status === 'offered') {
            summary.offers++;
        }

        const date = new Date(app.applied_at);

        if (!Number.isNaN(date.getTime())) {
            const month = `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1
).padStart(2, '0')}`;

            summary.monthlyCounts[month] =
                (summary.monthlyCounts[month] || 0) + 1;
        }
    });

    return summary;
}

// Allow Jest to test this function in Node.js.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { calculateApplicationAnalytics };
}
