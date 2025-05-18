import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface PdfGenerationOptions {
  title: string;
  period?: string;
  schoolFilter?: string;
  classFilter?: string;
  assessmentData: any[];
}

// Assessment-specific PDF preview generator
export interface AssessmentPdfOptions {
  studentName: string;
  assessorName: string;
  taskName: string;
  criteria: Array<{
    name: string;
    description?: string;
    score: number;
    feedback?: string;
  }>;
  overallFeedback?: string;
  totalScore: number;
  date: Date;
}

// Generate a PDF preview for assessment feedback
export const generatePDFPreview = (options: AssessmentPdfOptions): Blob => {
  const { 
    studentName, 
    assessorName, 
    taskName, 
    criteria, 
    overallFeedback = "", 
    totalScore, 
    date 
  } = options;
  
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add header with styling
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, 210, 15, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.text("Assessment Feedback Report", 105, 10, { align: "center" });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Add assessment details
  doc.setFontSize(14);
  doc.text("Assessment Details", 14, 25);
  
  doc.setDrawColor(220, 220, 220);
  doc.line(14, 28, 196, 28);
  
  // Create detail table
  autoTable(doc, {
    startY: 32,
    head: [],
    body: [
      [{ content: 'Student:', styles: { fontStyle: 'bold' } }, { content: studentName }],
      [{ content: 'Task:', styles: { fontStyle: 'bold' } }, { content: taskName }],
      [{ content: 'Assessor:', styles: { fontStyle: 'bold' } }, { content: assessorName }],
      [{ content: 'Date:', styles: { fontStyle: 'bold' } }, { content: date instanceof Date ? date.toLocaleDateString() : new Date(date).toLocaleDateString() }],
    ],
    theme: 'plain',
    styles: { cellPadding: 2 },
    columnStyles: { 0: { cellWidth: 30 } },
  });
  
  // Add score summary - safely get the last table's Y position
  let finalY = (doc as any).lastAutoTable?.finalY || 60;
  
  doc.setFontSize(14);
  doc.text("Score Summary", 14, finalY + 15);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, finalY + 18, 196, finalY + 18);
  
  // Calculate score percentage and max score
  const maxScore = 5; // Maximum score per criterion
  const maxTotalScore = criteria.length * maxScore;
  // Ensure totalScore is a valid number and calculate percentage
  const validTotalScore = Number.isFinite(totalScore) ? totalScore : 0;
  const scorePercentage = Math.round((validTotalScore / maxTotalScore) * 100);
  
  // Add score visualization
  doc.setFillColor(220, 220, 220);
  doc.rect(14, finalY + 25, 182, 8, 'F');
  
  // Calculate color based on percentage
  let fillColor: [number, number, number];
  if (scorePercentage < 40) fillColor = [231, 76, 60]; // Red
  else if (scorePercentage < 60) fillColor = [243, 156, 18]; // Orange
  else if (scorePercentage < 75) fillColor = [52, 152, 219]; // Blue
  else fillColor = [46, 204, 113]; // Green
  
  doc.setFillColor(fillColor[0], fillColor[1], fillColor[2]);
  const progressWidth = 182 * (scorePercentage / 100);
  doc.rect(14, finalY + 25, progressWidth, 8, 'F');
  
  // Add score information
  doc.setFontSize(12);
  doc.text(`${totalScore.toFixed(1)} / ${maxTotalScore} (${scorePercentage}%)`, 196, finalY + 40, { align: "right" });
  
  // Add criteria details with scores and feedback
  finalY = finalY + 50;
  
  doc.setFontSize(14);
  doc.text("Detailed Criterion Feedback", 14, finalY);
  doc.setDrawColor(220, 220, 220);
  doc.line(14, finalY + 3, 196, finalY + 3);
  
  finalY = finalY + 10;
  
  // Add individual criterion sections with feedback
  criteria.forEach((criterion, index) => {
    // Get score level
    let scoreLevel = "";
    if (criterion.score < 2) scoreLevel = "Needs Improvement";
    else if (criterion.score < 3) scoreLevel = "Developing";
    else if (criterion.score < 4) scoreLevel = "Proficient";
    else if (criterion.score < 4.5) scoreLevel = "Advanced";
    else scoreLevel = "Exemplary";
    
    // Title with score
    autoTable(doc, {
      startY: finalY,
      head: [[
        { content: `${index + 1}. ${criterion.name}`, styles: { halign: 'left' } },
        { content: `${criterion.score}/5 - ${scoreLevel}`, styles: { halign: 'right' } }
      ]],
      body: [],
      theme: 'striped',
      headStyles: { 
        fillColor: fillColor, 
        textColor: [255, 255, 255],
        fontSize: 11
      },
      styles: { cellPadding: 4 },
    });
    
    // Update Y position
    finalY = (doc as any).lastAutoTable.finalY || finalY;
    
    // Add description if available
    if (criterion.description) {
      autoTable(doc, {
        startY: finalY,
        head: [],
        body: [[
          { content: criterion.description }
        ]],
        theme: 'plain',
        styles: { cellPadding: 4, fontSize: 9, textColor: [100, 100, 100] },
      });
      
      finalY = (doc as any).lastAutoTable.finalY || finalY;
    }
    
    // Add feedback if available
    if (criterion.feedback && criterion.feedback.trim() !== "") {
      autoTable(doc, {
        startY: finalY,
        head: [
          [{ content: 'Feedback', styles: { fontStyle: 'bold', fontSize: 10 } }]
        ],
        body: [[
          { content: criterion.feedback }
        ]],
        theme: 'plain',
        headStyles: { 
          fillColor: [245, 245, 245], 
          textColor: [80, 80, 80] 
        },
        styles: { cellPadding: 4, fontSize: 10 },
      });
      
      finalY = (doc as any).lastAutoTable.finalY || finalY;
    }
    
    // Add space between criteria
    finalY += 10;
    
    // Check if we need a new page
    if (finalY > 270) {
      doc.addPage();
      finalY = 20;
    }
  });
  
  // Add overall feedback section if available
  if (overallFeedback && overallFeedback.trim() !== "") {
    doc.setFontSize(14);
    doc.text("Overall Feedback", 14, finalY);
    doc.setDrawColor(220, 220, 220);
    doc.line(14, finalY + 3, 196, finalY + 3);
    
    autoTable(doc, {
      startY: finalY + 8,
      head: [],
      body: [[
        { content: overallFeedback }
      ]],
      theme: 'plain',
      styles: { 
        cellPadding: 5, 
        fontSize: 10,
        cellWidth: 'auto',
        minCellHeight: 10,
      },
    });
  }
  
  // Add footer with date and page numbering
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Assessment Feedback Platform | Generated on ${new Date().toLocaleDateString()} | Page ${i} of ${pageCount}`, 
      105, 
      285, 
      { align: "center" }
    );
  }
  
  // Convert the PDF to a Blob object
  const blob = doc.output('blob');
  return blob;
};

export const generatePdf = (options: PdfGenerationOptions) => {
  const { title, period = "all time", schoolFilter = "all", classFilter = "all", assessmentData } = options;
  
  // Create a new PDF document
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(title, 14, 22);
  
  // Add report details
  doc.setFontSize(10);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 32);
  doc.text(`Period: ${period}`, 14, 38);
  doc.text(`School Filter: ${schoolFilter}`, 14, 44);
  doc.text(`Class Filter: ${classFilter}`, 14, 50);
  
  // Add summary information
  doc.setFontSize(14);
  doc.text("Assessment Summary", 14, 60);
  
  const completedAssessments = assessmentData.filter(a => a.status === "completed").length;
  const totalAssessments = assessmentData.length;
  const averageScore = assessmentData
    .filter(a => a.status === "completed")
    .reduce((acc, curr) => acc + curr.totalScore, 0) / (completedAssessments || 1);
  
  // Add summary table
  autoTable(doc, {
    startY: 65,
    head: [["Metric", "Value"]],
    body: [
      ["Total Assessments", totalAssessments.toString()],
      ["Completed Assessments", completedAssessments.toString()],
      ["Completion Rate", `${Math.round((completedAssessments / totalAssessments) * 100) || 0}%`],
      ["Average Score", `${averageScore.toFixed(2) || 0}/5`],
    ],
  });
  
  // Add assessment details
  doc.setFontSize(14);
  
  // Get the last table's Y position safely
  const lastTableY = (doc as any).lastAutoTable?.finalY || 100;
  doc.text("Assessment Details", 14, lastTableY + 15);
  
  const assessmentTableData = assessmentData.map(assessment => [
    assessment.student?.user?.fullName || "Unknown",
    assessment.task?.name || "Unknown",
    assessment.assessor?.user?.fullName || "Unknown",
    assessment.status === "completed" ? "Completed" : "Draft",
    assessment.status === "completed" ? assessment.totalScore.toFixed(1) + "/5" : "N/A",
    assessment.updatedAt ? new Date(assessment.updatedAt).toLocaleDateString() : "N/A",
  ]);
  
  autoTable(doc, {
    startY: (doc as any).lastAutoTable?.finalY + 20 || 120,
    head: [["Student", "Task", "Assessor", "Status", "Score", "Last Updated"]],
    body: assessmentTableData,
  });
  
  // Add page number at the bottom
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(10);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width / 2, 
      doc.internal.pageSize.height - 10, { align: "center" });
  }
  
  // Save PDF with a filename
  const filename = `${title.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
  doc.save(filename);
  
  return filename;
};