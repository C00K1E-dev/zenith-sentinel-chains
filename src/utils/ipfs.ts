// IPFS Upload utilities using Pinata
interface PinataResponse {
  IpfsHash: string;
  PinSize: number;
  Timestamp: string;
}

interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

/**
 * Upload a file to IPFS using Pinata API
 */
export async function uploadToIPFS(
  file: File | Blob, 
  filename: string,
  metadata?: Record<string, any>
): Promise<IPFSUploadResult> {
  try {
    // Get Pinata JWT from environment variables
    const pinataJWT = import.meta.env.VITE_PINATA_JWT;
    if (!pinataJWT) {
      throw new Error('PINATA_JWT environment variable not set');
    }

    const formData = new FormData();
    formData.append('file', file, filename);

    // Add metadata if provided
    if (metadata) {
      formData.append('pinataMetadata', JSON.stringify({
        name: filename,
        ...metadata
      }));
    }

    // Add pinata options for optimization
    formData.append('pinataOptions', JSON.stringify({
      cidVersion: 1,
      wrapWithDirectory: false
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${pinataJWT}`
      },
      body: formData
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Pinata upload failed: ${response.status} - ${errorText}`);
    }

    const result: PinataResponse = await response.json();
    
    return {
      success: true,
      hash: result.IpfsHash,
      url: `https://sapphire-peculiar-shark-548.mypinata.cloud/ipfs/${result.IpfsHash}`
    };

  } catch (error) {
    console.error('IPFS upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}

/**
 * Convert SVG assets to base64 data URLs for PDF embedding
 */
async function getLogosAsDataURLs(): Promise<{logo: string, holoSeal: string}> {
  try {
    console.log('🔄 Loading logo and holo seal...');
    
    // Load both SVGs in parallel
    const [logoResponse, holoResponse] = await Promise.all([
      fetch('/ss-icon.svg'),
      fetch('/ssHoloNew.svg')
    ]);
    
    const [logoSvg, holoSvg] = await Promise.all([
      logoResponse.text(),
      holoResponse.text()
    ]);
    
    const logoBase64 = btoa(logoSvg);
    const holoBase64 = btoa(holoSvg);
    
    console.log('✅ Both assets loaded - Logo:', logoBase64.length, 'chars, Holo:', holoBase64.length, 'chars');
    
    return {
      logo: `data:image/svg+xml;base64,${logoBase64}`,
      holoSeal: `data:image/svg+xml;base64,${holoBase64}`
    };
  } catch (error) {
    console.error('Failed to load SVG assets:', error);
    // Return fallback empty SVGs
    const fallbackSvg = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48L3N2Zz4=';
    return {
      logo: fallbackSvg,
      holoSeal: fallbackSvg
    };
  }
}

/**
 * Generate PDF from HTML content using jsPDF and html2canvas
 */
export async function generatePDFFromHTML(htmlContent: string, filename: string): Promise<File | null> {
  try {
    console.log('🔄 Loading SVG assets for PDF embedding...');
    
    // Load both logo and holo seal as base64 data URLs
    const { logo, holoSeal } = await getLogosAsDataURLs();
    
    // Replace all SVG paths with base64 data URLs in HTML
    const htmlWithEmbeddedAssets = htmlContent
      .replace(/src="\/ss-icon\.svg"/g, `src="${logo}"`)
      .replace(/src="\/ssHoloNew\.svg"/g, `src="${holoSeal}"`);
    
    console.log('✅ Both SVG assets embedded in HTML');

    // Import dynamically to avoid SSR issues
    const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
      import('html2canvas'),
      import('jspdf')
    ]);

    // Create a temporary iframe to render HTML
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1200px';
    iframe.style.height = '1600px';
    iframe.style.visibility = 'hidden';
    document.body.appendChild(iframe);

    // Write HTML content with embedded assets to iframe
    iframe.contentDocument?.open();
    iframe.contentDocument?.write(htmlWithEmbeddedAssets);
    iframe.contentDocument?.close();

    // Wait for content and fonts to load properly
    await new Promise(resolve => {
      const checkLoad = () => {
        if (iframe.contentDocument?.readyState === 'complete') {
          // Additional wait for fonts and CSS to fully apply
          setTimeout(resolve, 2000);
        } else {
          setTimeout(checkLoad, 100);
        }
      };
      checkLoad();
    });

    if (!iframe.contentDocument?.body) {
      throw new Error('Failed to render HTML content');
    }

    // Capture the HTML as canvas with improved options
    const canvas = await html2canvas(iframe.contentDocument.body, {
      width: 1200,
      height: 1600,
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0a0a0a',
      logging: false,
      imageTimeout: 15000,
      removeContainer: true,
      foreignObjectRendering: true, // Better text rendering
      onclone: (clonedDoc) => {
        // Ensure fonts are loaded in cloned document
        const fontLink = clonedDoc.createElement('link');
        fontLink.rel = 'stylesheet';
        fontLink.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap';
        clonedDoc.head.appendChild(fontLink);
        
        // Force font loading and fix PDF-specific alignment issues
        const style = clonedDoc.createElement('style');
        style.textContent = `
          * { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important; 
          }
          
          /* Fix pill text alignment for PDF */
          .pill-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            text-align: center !important;
            line-height: 1.0 !important;
            padding-top: 0.3rem !important;
            padding-bottom: 0.7rem !important;
          }
          
          .pill-container span {
            margin: 0 !important;
            padding: 0 !important;
            line-height: 1.0 !important;
          }
          
          .pill-container span:first-child {
            margin-bottom: 0.1rem !important;
          }
          
          /* Fix logo alignment for PDF */
          .inline-logo {
            vertical-align: baseline !important;
            margin-top: 0.4rem !important;
            margin-bottom: 0 !important;
            height: 2rem !important;
            width: auto !important;
            max-width: 2.5rem !important;
            object-fit: contain !important;
            display: inline-block !important;
          }
          
          /* Fix score status for PDF */
          .score-status {
            margin-top: 0.15rem !important;
            transform: translateY(-0.1rem) !important;
          }
          
          /* Ensure header alignment */
          .header-bg .flex {
            align-items: baseline !important;
          }
          
          /* Fix holo seal styling for PDF */
          .ss-seal {
            width: auto !important;
            height: 60px !important;
            max-width: 80px !important;
            object-fit: contain !important;
            display: inline-block !important;
          }
        `;
        clonedDoc.head.appendChild(style);
      }
    });

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [1200, 1600]
    });

    const imgData = canvas.toDataURL('image/png');
    pdf.addImage(imgData, 'PNG', 0, 0, 1200, 1600);

    // Convert PDF to blob
    const pdfBlob = pdf.output('blob');
    
    // Clean up iframe
    document.body.removeChild(iframe);

    // Return as File object
    return new File([pdfBlob], filename, { type: 'application/pdf' });

  } catch (error) {
    console.error('PDF generation error:', error);
    return null;
  }
}

/**
 * Upload audit report PDF to IPFS
 */
export async function uploadAuditReportToIPFS(
  htmlContent: string, 
  contractName: string,
  auditData: any
): Promise<IPFSUploadResult> {
  try {
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().slice(0, 19).replace(/[:.]/g, '-');
    const filename = `SmartSentinels-Audit-${contractName}-${timestamp}.pdf`;

    console.log('🔄 Generating PDF from HTML...');
    
    // Generate PDF from HTML
    const pdfFile = await generatePDFFromHTML(htmlContent, filename);
    if (!pdfFile) {
      throw new Error('Failed to generate PDF from HTML');
    }

    console.log('📄 PDF generated successfully, size:', pdfFile.size, 'bytes');
    console.log('🔄 Uploading to IPFS...');

    // Upload to IPFS with metadata
    const result = await uploadToIPFS(pdfFile, filename, {
      contractName,
      auditScore: auditData.securityScore,
      auditDate: new Date().toISOString(),
      reportType: 'SmartSentinels AI Audit Report',
      version: '1.0'
    });

    if (result.success) {
      console.log('✅ Report uploaded to IPFS:', result.url);
    }

    return result;

  } catch (error) {
    console.error('❌ Audit report IPFS upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error'
    };
  }
}