
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(
    path.join(__dirname, '../src/public/applications.html'),
    'utf8'
);

describe('Application Analytics Dashboard', () => {
    test('displays the application overview statistics', () => {
        expect(html).toContain('id="application-analytics"');
        expect(html).toContain('id="total-applications"');
        expect(html).toContain('id="under-review-count"');
        expect(html).toContain('id="interview-count"');
        expect(html).toContain('id="offer-count"');
    });

    test('includes the applications over time chart', () => {
        expect(html).toContain('id="applications-chart"');
    });

    test('preserves the application history section', () => {
        expect(html).toContain('id="applications"');
    });

    test('loads the analytics stylesheet', () => {
        expect(html).toContain('/css/application-analytics.css');
    });
});

const {
    calculateApplicationAnalytics
} = require('../src/public/js/application-analytics.js');

describe('Application Analytics Calculations', () => {
    test('calculates totals for different application statuses', () => {
        const applications = [
            { status: 'applied', applied_at: '2026-11-01' },
            { status: 'under_review', applied_at: '2026-11-02' },
            { status: 'under_review', applied_at: '2026-11-03' },
            { status: 'interview', applied_at: '2026-11-04' },
            { status: 'offered', applied_at: '2026-11-05' }
        ];

        const result = calculateApplicationAnalytics(applications);

        expect(result.total).toBe(5);
        expect(result.underReview).toBe(2);
        expect(result.interviews).toBe(1);
        expect(result.offers).toBe(1);
    });

    test('groups applications by month', () => {
        const applications = [
            { status: 'applied', applied_at: '2026-09-10' },
            { status: 'applied', applied_at: '2026-10-05' },
            { status: 'interview', applied_at: '2026-10-15' },
            { status: 'offered', applied_at: '2026-11-01' }
        ];

        const result = calculateApplicationAnalytics(applications);

        expect(result.monthlyCounts['2026-09']).toBe(1);
        expect(result.monthlyCounts['2026-10']).toBe(2);
        expect(result.monthlyCounts['2026-11']).toBe(1);
    });

    test('handles an empty application history', () => {
        const result = calculateApplicationAnalytics([]);

        expect(result.total).toBe(0);
        expect(result.underReview).toBe(0);
        expect(result.interviews).toBe(0);
        expect(result.offers).toBe(0);
        expect(result.monthlyCounts).toEqual({});
    });

    test('ignores invalid dates in monthly activity', () => {
        const applications = [
            { status: 'applied', applied_at: 'invalid-date' }
        ];

        const result = calculateApplicationAnalytics(applications);

        expect(result.total).toBe(1);
        expect(result.monthlyCounts).toEqual({});
    });
});
