import { useState, useEffect } from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileIcon, RefreshCw, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface PDFPreviewProps {
  pdfUrl?: string;
  generatePdfFn?: () => Promise<string | Blob>;
  title?: string;
  loading?: boolean;
}

const PDFPreview = ({
  pdfUrl,
  generatePdfFn,
  title = "PDF Feedback Preview",
  loading = false,
}: PDFPreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(pdfUrl);
  // Store blob URLs to revoke them when component unmounts
  const [blobUrls, setBlobUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(loading);
  const [error, setError] = useState<string | null>(null);

  // Generate preview if function is provided and no URL is passed
  useEffect(() => {
    if (!pdfUrl && generatePdfFn) {
      handleRefreshPreview();
    } else {
      setPreviewUrl(pdfUrl);
    }
  }, [pdfUrl, generatePdfFn]);

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      blobUrls.forEach(url => {
        URL.revokeObjectURL(url);
      });
    };
  }, [blobUrls]);

  const handleRefreshPreview = async () => {
    if (!generatePdfFn) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await generatePdfFn();
      
      // Handle both string and Blob data types
      if (typeof result === 'string') {
        setPreviewUrl(result);
      } else if (result instanceof Blob) {
        // Convert Blob to URL
        const url = URL.createObjectURL(result);
        setPreviewUrl(url);
        setBlobUrls(prev => [...prev, url]); // Store for cleanup
      } else {
        throw new Error('Unsupported PDF data format');
      }
    } catch (err) {
      console.error("Error generating PDF preview:", err);
      setError("Failed to generate PDF preview");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        {generatePdfFn && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshPreview}
            disabled={isLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Preview
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 p-8">
            <Skeleton className="h-[400px] w-full rounded-md" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-red-500">{error}</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefreshPreview} 
              className="mt-4"
            >
              Try Again
            </Button>
          </div>
        ) : previewUrl ? (
          <div className="max-h-[500px] overflow-auto rounded-md border">
            <iframe 
              src={previewUrl} 
              className="w-full h-[500px] rounded-md" 
              title="PDF Preview"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-8 text-center">
            <FileIcon className="h-16 w-16 text-gray-400 mb-4" />
            <p className="text-gray-500">No PDF preview available</p>
            {generatePdfFn && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRefreshPreview} 
                className="mt-4"
              >
                Generate Preview
              </Button>
            )}
          </div>
        )}
      </CardContent>
      {previewUrl && (
        <CardFooter className="justify-end">
          <a 
            href={previewUrl} 
            download={`assessment_feedback.pdf`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </a>
        </CardFooter>
      )}
    </Card>
  );
};

export default PDFPreview;
