import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface PDFExportOptions {
    filename: string;
    title: string;
    subtitle?: string;
}

/**
 * Export a DOM element to PDF
 */
export async function exportElementToPDF(
    element: HTMLElement,
    options: PDFExportOptions
): Promise<void> {
    try {
        // Capture the element as canvas
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#020617',
        });

        // Calculate dimensions
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();

        // Calculate image dimensions to fit page
        const imgWidth = pdfWidth - 20; // 10mm margin on each side
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        let heightLeft = imgHeight;
        let position = 10; // Start with 10mm margin

        // Add title page
        pdf.setFontSize(24);
        pdf.text(options.title, pdfWidth / 2, 30, { align: 'center' });

        if (options.subtitle) {
            pdf.setFontSize(12);
            pdf.setTextColor(150, 150, 150);
            pdf.text(options.subtitle, pdfWidth / 2, 40, { align: 'center' });
        }

        pdf.setTextColor(100, 100, 100);
        pdf.setFontSize(10);
        pdf.text(`Generated on ${new Date().toLocaleDateString()}`, pdfWidth / 2, pdfHeight - 10, {
            align: 'center',
        });

        // Add first page with some space after title
        position = 50;
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - position);

        // Add remaining pages if needed
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pdfHeight;
        }

        // Save the PDF
        pdf.save(options.filename);
    } catch (error) {
        console.error('Error generating PDF:', error);
        throw new Error('Failed to generate PDF. Please try again.');
    }
}

/**
 * Export analytics data as a formatted PDF report
 */
export async function exportAnalyticsReport(
    analyticsData: {
        cgpa: number;
        avgGpa: number;
        highestSem: number;
        lowestSem: number;
        improvement: number;
        gpaProjection: number;
        semesterCount: number;
        subjectCount: number;
        recommendations: string;
        semesters: Array<{ semester: number; gpa: number; credits: number; subjects: number }>;
    },
    profileName: string
): Promise<void> {
    try {
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        let yPosition = 20;

        // Header
        pdf.setFontSize(24);
        pdf.setTextColor(124, 92, 255); // Purple
        pdf.text('GradeForge Analytics Report', pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 10;
        pdf.setFontSize(12);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Student: ${profileName}`, pageWidth / 2, yPosition, { align: 'center' });

        yPosition += 8;
        pdf.setFontSize(10);
        pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, pageWidth / 2, yPosition, {
            align: 'center',
        });

        yPosition += 15;

        // Key Metrics
        pdf.setFontSize(14);
        pdf.setTextColor(0, 0, 0);
        pdf.text('Key Performance Metrics', 20, yPosition);

        yPosition += 10;
        const metrics = [
            ['Overall CGPA', analyticsData.cgpa.toFixed(2)],
            ['Average GPA', analyticsData.avgGpa.toFixed(2)],
            ['Highest Semester GPA', analyticsData.highestSem.toFixed(2)],
            ['Lowest Semester GPA', analyticsData.lowestSem.toFixed(2)],
            ['Improvement', analyticsData.improvement > 0 ? `+${analyticsData.improvement.toFixed(2)}` : analyticsData.improvement.toFixed(2)],
            ['Projected Next Semester', analyticsData.gpaProjection.toFixed(2)],
        ];

        pdf.setFontSize(10);
        metrics.forEach(([label, value]) => {
            pdf.text(`${label}:`, 25, yPosition);
            pdf.setTextColor(124, 92, 255);
            pdf.text(value, pageWidth - 30, yPosition, { align: 'right' });
            pdf.setTextColor(0, 0, 0);
            yPosition += 7;
        });

        yPosition += 5;

        // Academic Summary
        pdf.setFontSize(14);
        pdf.text('Academic Summary', 20, yPosition);
        yPosition += 10;

        const summary = [
            `Semesters Completed: ${analyticsData.semesterCount}`,
            `Total Subjects: ${analyticsData.subjectCount}`,
            `Status: ${analyticsData.cgpa >= 8.5 ? 'Excellent 🌟' : analyticsData.cgpa >= 7.5 ? 'Good ✅' : analyticsData.cgpa >= 6.5 ? 'Average 📊' : 'Needs Improvement 📈'}`,
        ];

        pdf.setFontSize(10);
        summary.forEach((text) => {
            pdf.text(text, 25, yPosition);
            yPosition += 7;
        });

        yPosition += 10;

        // Semester Breakdown
        if (analyticsData.semesters.length > 0) {
            if (yPosition > pageHeight - 40) {
                pdf.addPage();
                yPosition = 20;
            }

            pdf.setFontSize(14);
            pdf.text('Semester Breakdown', 20, yPosition);
            yPosition += 10;

            pdf.setFontSize(9);
            analyticsData.semesters.forEach((sem) => {
                const semText = `Semester ${sem.semester}: GPA ${sem.gpa.toFixed(2)} | ${sem.subjects} subjects | ${sem.credits} credits`;
                pdf.text(semText, 25, yPosition);
                yPosition += 6;

                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 20;
                }
            });
        }

        yPosition += 5;

        // AI Recommendations
        if (analyticsData.recommendations && yPosition > pageHeight - 60) {
            pdf.addPage();
            yPosition = 20;
        }

        if (analyticsData.recommendations) {
            pdf.setFontSize(14);
            pdf.text('AI Study Recommendations', 20, yPosition);
            yPosition += 10;

            pdf.setFontSize(10);
            const maxWidth = pageWidth - 40;
            const recommendationLines = pdf.splitTextToSize(analyticsData.recommendations, maxWidth) as string[];

            recommendationLines.forEach((line: string) => {
                if (yPosition > pageHeight - 20) {
                    pdf.addPage();
                    yPosition = 20;
                }
                pdf.text(line, 25, yPosition);
                yPosition += 6;
            });
        }

        // Footer
        const totalPages = pdf.internal.pages.length - 1;
        for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setFontSize(9);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
        }

        pdf.save(`GradeForge_Analytics_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error('Error generating analytics report:', error);
        throw new Error('Failed to generate analytics report. Please try again.');
    }
}
