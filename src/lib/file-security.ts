// File upload security and validation
// Comprehensive file handling with malware detection and content validation

import { SecurityError, InputValidator } from './security';

// File security configuration
const FILE_SECURITY_CONFIG = {
  // Maximum file sizes by type
  MAX_SIZES: {
    'image/svg+xml': 1 * 1024 * 1024,      // 1MB
    'image/png': 10 * 1024 * 1024,         // 10MB
    'image/jpeg': 10 * 1024 * 1024,        // 10MB
    'image/webp': 10 * 1024 * 1024,        // 10MB
    'application/pdf': 50 * 1024 * 1024,   // 50MB
    'default': 5 * 1024 * 1024              // 5MB default
  },
  
  // Allowed MIME types for each file category
  ALLOWED_TYPES: {
    images: ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'],
    documents: ['application/pdf'],
    vectors: ['image/svg+xml']
  },
  
  // File signature validation (magic numbers)
  FILE_SIGNATURES: {
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // RIFF header
    'application/pdf': [0x25, 0x50, 0x44, 0x46], // %PDF
  },
  
  // Dangerous file extensions and patterns
  DANGEROUS_EXTENSIONS: [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar', 
    '.php', '.asp', '.aspx', '.jsp', '.py', '.rb', '.pl', '.sh', '.ps1'
  ],
  
  // Dangerous content patterns in files
  DANGEROUS_PATTERNS: [
    /<script[^>]*>/i,
    /javascript:/i,
    /vbscript:/i,
    /data:text\/html/i,
    /on\w+\s*=/i, // Event handlers
    /<embed[^>]*>/i,
    /<object[^>]*>/i,
    /<iframe[^>]*>/i,
    /<link[^>]*>/i,
    /<meta[^>]*>/i,
    /eval\s*\(/i,
    /document\.write/i,
    /window\.location/i,
  ]
} as const;

// File security validator
export class FileSecurityValidator {
  
  // Main file validation function
  static async validateFile(file: File, allowedCategory: keyof typeof FILE_SECURITY_CONFIG.ALLOWED_TYPES = 'images'): Promise<SecureFileInfo> {
    try {
      // Basic file validation
      this.validateBasicProperties(file, allowedCategory);
      
      // Read file content for validation
      const content = await this.readFileContent(file);
      
      // Validate file signature
      await this.validateFileSignature(file.type, content);
      
      // Validate file content
      await this.validateFileContent(content, file.type);
      
      // Generate secure file info
      return this.generateSecureFileInfo(file, content);
      
    } catch (error) {
      if (error instanceof SecurityError) {
        throw error;
      }
      throw new SecurityError(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Validate basic file properties
  private static validateBasicProperties(file: File, allowedCategory: keyof typeof FILE_SECURITY_CONFIG.ALLOWED_TYPES): void {
    // Validate file name
    const sanitizedName = InputValidator.validateFileName(file.name);
    
    // Check file extension
    const extension = sanitizedName.toLowerCase().substring(sanitizedName.lastIndexOf('.'));
    if (FILE_SECURITY_CONFIG.DANGEROUS_EXTENSIONS.includes(extension)) {
      throw new SecurityError(`File extension ${extension} is not allowed`);
    }
    
    // Validate MIME type
    const allowedTypes = FILE_SECURITY_CONFIG.ALLOWED_TYPES[allowedCategory];
    if (!allowedTypes.includes(file.type)) {
      throw new SecurityError(`File type ${file.type} is not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }
    
    // Check file size
    const maxSize = FILE_SECURITY_CONFIG.MAX_SIZES[file.type] || FILE_SECURITY_CONFIG.MAX_SIZES.default;
    if (file.size > maxSize) {
      throw new SecurityError(`File size ${file.size} exceeds limit of ${maxSize} bytes`);
    }
    
    if (file.size === 0) {
      throw new SecurityError('Empty files are not allowed');
    }
  }
  
  // Read file content safely
  private static async readFileContent(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new SecurityError('Failed to read file as ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(new SecurityError('Failed to read file'));
      };
      
      // Set timeout to prevent long-running file reads
      setTimeout(() => {
        reader.abort();
        reject(new SecurityError('File reading timeout'));
      }, 30000); // 30 seconds
      
      reader.readAsArrayBuffer(file);
    });
  }
  
  // Validate file signature (magic numbers)
  private static async validateFileSignature(mimeType: string, content: ArrayBuffer): Promise<void> {
    const signature = FILE_SECURITY_CONFIG.FILE_SIGNATURES[mimeType];
    if (!signature) {
      return; // No signature validation for this type
    }
    
    const bytes = new Uint8Array(content);
    
    // Check if file starts with expected signature
    for (let i = 0; i < signature.length; i++) {
      if (bytes[i] !== signature[i]) {
        throw new SecurityError(`File signature mismatch: file does not appear to be a valid ${mimeType}`);
      }
    }
    
    // Additional MIME-specific validations
    await this.validateSpecificFormat(mimeType, bytes);
  }
  
  // Validate specific file format requirements
  private static async validateSpecificFormat(mimeType: string, bytes: Uint8Array): Promise<void> {
    switch (mimeType) {
      case 'image/svg+xml':
        await this.validateSVGContent(bytes);
        break;
        
      case 'image/png':
        await this.validatePNGStructure(bytes);
        break;
        
      case 'image/jpeg':
        await this.validateJPEGStructure(bytes);
        break;
        
      case 'image/webp':
        await this.validateWebPStructure(bytes);
        break;
        
      case 'application/pdf':
        await this.validatePDFStructure(bytes);
        break;
    }
  }
  
  // SVG-specific validation
  private static async validateSVGContent(bytes: Uint8Array): Promise<void> {
    const text = new TextDecoder().decode(bytes);
    
    // Use existing SVG validator
    try {
      InputValidator.validateSVGContent(text);
    } catch (error) {
      throw new SecurityError(`SVG validation failed: ${error instanceof Error ? error.message : 'Invalid SVG'}`);
    }
    
    // Additional SVG-specific checks
    if (!text.includes('<svg') || !text.includes('</svg>')) {
      throw new SecurityError('Invalid SVG structure: missing svg tags');
    }
    
    // Check for embedded content that shouldn't be in SVG
    if (text.includes('<?php') || text.includes('<%') || text.includes('<script')) {
      throw new SecurityError('SVG contains potentially dangerous embedded content');
    }
  }
  
  // PNG structure validation
  private static async validatePNGStructure(bytes: Uint8Array): Promise<void> {
    if (bytes.length < 33) { // Minimum PNG size
      throw new SecurityError('PNG file is too small to be valid');
    }
    
    // Check for IHDR chunk (should be first chunk after signature)
    const ihdrPos = 8; // After PNG signature
    const ihdrSignature = [0x49, 0x48, 0x44, 0x52]; // IHDR
    
    for (let i = 0; i < 4; i++) {
      if (bytes[ihdrPos + 4 + i] !== ihdrSignature[i]) {
        throw new SecurityError('Invalid PNG structure: missing IHDR chunk');
      }
    }
    
    // Basic dimension validation
    const width = this.readUint32BE(bytes, ihdrPos + 8);
    const height = this.readUint32BE(bytes, ihdrPos + 12);
    
    if (width === 0 || height === 0 || width > 65535 || height > 65535) {
      throw new SecurityError('PNG has invalid dimensions');
    }
  }
  
  // JPEG structure validation
  private static async validateJPEGStructure(bytes: Uint8Array): Promise<void> {
    if (bytes.length < 10) {
      throw new SecurityError('JPEG file is too small to be valid');
    }
    
    // Check for SOI (Start of Image) marker
    if (bytes[0] !== 0xFF || bytes[1] !== 0xD8) {
      throw new SecurityError('Invalid JPEG: missing SOI marker');
    }
    
    // Look for EOI (End of Image) marker at the end
    if (bytes[bytes.length - 2] !== 0xFF || bytes[bytes.length - 1] !== 0xD9) {
      throw new SecurityError('Invalid JPEG: missing EOI marker');
    }
  }
  
  // WebP structure validation
  private static async validateWebPStructure(bytes: Uint8Array): Promise<void> {
    if (bytes.length < 12) {
      throw new SecurityError('WebP file is too small to be valid');
    }
    
    // Check RIFF header and WebP signature
    const riffHeader = [0x52, 0x49, 0x46, 0x46]; // RIFF
    const webpSig = [0x57, 0x45, 0x42, 0x50]; // WEBP
    
    for (let i = 0; i < 4; i++) {
      if (bytes[i] !== riffHeader[i]) {
        throw new SecurityError('Invalid WebP: incorrect RIFF header');
      }
      if (bytes[8 + i] !== webpSig[i]) {
        throw new SecurityError('Invalid WebP: incorrect WebP signature');
      }
    }
  }
  
  // PDF structure validation
  private static async validatePDFStructure(bytes: Uint8Array): Promise<void> {
    const text = new TextDecoder().decode(bytes.slice(0, Math.min(1024, bytes.length)));
    
    // Check PDF version
    if (!text.match(/^%PDF-\d\.\d/)) {
      throw new SecurityError('Invalid PDF: missing or invalid PDF header');
    }
    
    // Look for basic PDF structure elements
    if (!text.includes('obj') || !text.includes('endobj')) {
      throw new SecurityError('Invalid PDF: missing required structure elements');
    }
    
    // Check for potentially dangerous content
    const dangerousPDFContent = [
      '/JavaScript', '/JS', '/OpenAction', '/Launch', '/EmbeddedFile', '/FileAttachment'
    ];
    
    for (const dangerous of dangerousPDFContent) {
      if (text.includes(dangerous)) {
        throw new SecurityError(`PDF contains potentially dangerous content: ${dangerous}`);
      }
    }
  }
  
  // Validate file content for dangerous patterns
  private static async validateFileContent(content: ArrayBuffer, mimeType: string): Promise<void> {
    // Convert to text for pattern matching (for text-based formats)
    const textFormats = ['image/svg+xml', 'application/pdf'];
    
    if (textFormats.includes(mimeType)) {
      const text = new TextDecoder('utf-8', { fatal: false }).decode(content);
      
      // Check for dangerous patterns
      for (const pattern of FILE_SECURITY_CONFIG.DANGEROUS_PATTERNS) {
        if (pattern.test(text)) {
          throw new SecurityError(`File contains dangerous pattern: ${pattern.source}`);
        }
      }
    }
    
    // Check for embedded executables (PE header)
    const bytes = new Uint8Array(content);
    if (this.containsExecutable(bytes)) {
      throw new SecurityError('File contains embedded executable code');
    }
  }
  
  // Check for embedded executable content
  private static containsExecutable(bytes: Uint8Array): boolean {
    // Check for PE header (Windows executables)
    const peSignature = [0x4D, 0x5A]; // MZ header
    
    for (let i = 0; i < bytes.length - 1; i++) {
      if (bytes[i] === peSignature[0] && bytes[i + 1] === peSignature[1]) {
        return true;
      }
    }
    
    // Check for ELF header (Linux executables)
    const elfSignature = [0x7F, 0x45, 0x4C, 0x46]; // .ELF
    
    for (let i = 0; i < bytes.length - 3; i++) {
      if (bytes[i] === elfSignature[0] && bytes[i + 1] === elfSignature[1] && 
          bytes[i + 2] === elfSignature[2] && bytes[i + 3] === elfSignature[3]) {
        return true;
      }
    }
    
    return false;
  }
  
  // Generate secure file information
  private static generateSecureFileInfo(file: File, content: ArrayBuffer): SecureFileInfo {
    return {
      originalName: InputValidator.validateFileName(file.name),
      sanitizedName: this.generateSanitizedFileName(file.name),
      mimeType: file.type,
      size: file.size,
      lastModified: new Date(file.lastModified),
      contentHash: this.generateContentHash(content),
      isValid: true,
      validatedAt: new Date(),
      securityChecks: {
        signatureValidated: true,
        contentScanned: true,
        dangerousPatternsChecked: true,
        sizeValidated: true
      }
    };
  }
  
  // Generate sanitized file name
  private static generateSanitizedFileName(originalName: string): string {
    const sanitized = InputValidator.validateFileName(originalName);
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    const extension = sanitized.substring(sanitized.lastIndexOf('.'));
    const baseName = sanitized.substring(0, sanitized.lastIndexOf('.')).substring(0, 20);
    
    return `${baseName}_${timestamp}_${randomSuffix}${extension}`;
  }
  
  // Generate content hash for integrity verification
  private static async generateContentHash(content: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', content);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  // Utility function to read 32-bit big-endian integer
  private static readUint32BE(bytes: Uint8Array, offset: number): number {
    return (bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3];
  }
}

// Secure file information interface
export interface SecureFileInfo {
  originalName: string;
  sanitizedName: string;
  mimeType: string;
  size: number;
  lastModified: Date;
  contentHash: string;
  isValid: boolean;
  validatedAt: Date;
  securityChecks: {
    signatureValidated: boolean;
    contentScanned: boolean;
    dangerousPatternsChecked: boolean;
    sizeValidated: boolean;
  };
}

// File quarantine system
export class FileQuarantine {
  private static quarantinedFiles = new Map<string, QuarantinedFile>();
  
  static quarantineFile(file: File, reason: string, threat: string): string {
    const quarantineId = crypto.randomUUID();
    const quarantinedFile: QuarantinedFile = {
      id: quarantineId,
      originalName: file.name,
      size: file.size,
      mimeType: file.type,
      quarantineReason: reason,
      threatType: threat,
      quarantinedAt: new Date(),
      status: 'quarantined'
    };
    
    this.quarantinedFiles.set(quarantineId, quarantinedFile);
    
    console.warn('File quarantined:', {
      id: quarantineId,
      file: file.name,
      reason,
      threat
    });
    
    return quarantineId;
  }
  
  static getQuarantinedFile(id: string): QuarantinedFile | null {
    return this.quarantinedFiles.get(id) || null;
  }
  
  static releaseFile(id: string, adminUserId: string): boolean {
    const file = this.quarantinedFiles.get(id);
    if (!file) return false;
    
    file.status = 'released';
    file.releasedAt = new Date();
    file.releasedBy = adminUserId;
    
    console.log('File released from quarantine:', { id, adminUserId });
    return true;
  }
  
  static deleteQuarantinedFile(id: string, adminUserId: string): boolean {
    const file = this.quarantinedFiles.get(id);
    if (!file) return false;
    
    this.quarantinedFiles.delete(id);
    
    console.log('Quarantined file deleted:', { id, adminUserId });
    return true;
  }
}

interface QuarantinedFile {
  id: string;
  originalName: string;
  size: number;
  mimeType: string;
  quarantineReason: string;
  threatType: string;
  quarantinedAt: Date;
  status: 'quarantined' | 'released' | 'deleted';
  releasedAt?: Date;
  releasedBy?: string;
}

// Export main validator and utilities
export { FileSecurityValidator, FILE_SECURITY_CONFIG };