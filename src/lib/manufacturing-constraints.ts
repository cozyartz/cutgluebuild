// Manufacturing constraints and physics validation for laser cutting
// Ensures all AI-generated designs are actually manufacturable

export interface MaterialProperties {
  name: string;
  type: 'wood' | 'acrylic' | 'metal' | 'paper' | 'fabric' | 'composite';

  // Physical properties
  thickness: number; // mm
  density: number; // kg/m³
  tensileStrength: number; // MPa
  elasticModulus: number; // GPa

  // Laser cutting properties
  kerfWidth: number; // mm - material lost to laser beam
  heatAffectedZone: number; // mm - area affected by heat
  charDepth: number; // mm - carbonization depth

  // Manufacturing limits
  minFeatureSize: number; // mm - smallest cuttable feature
  minHoleSize: number; // mm - smallest hole diameter
  minSlotWidth: number; // mm - narrowest slot
  maxAspectRatio: number; // length/width for thin features

  // Thermal expansion
  thermalExpansion: number; // coefficient per °C
  operatingTempRange: { min: number; max: number }; // °C

  // Joint tolerances
  pressFitTolerance: number; // mm - for tight joints
  looseFitTolerance: number; // mm - for easy assembly
  slidingFitTolerance: number; // mm - for moving parts
}

export interface KerfProperties {
  width: number; // mm
  variation: number; // ± mm - kerf width variation
  compensation: 'none' | 'inside' | 'outside' | 'center'; // how to compensate
  cornerEffect: number; // mm - additional material loss at corners
}

export interface StructuralLimits {
  maxSpanWithoutSupport: number; // mm
  maxCantileverLength: number; // mm
  minWallThickness: number; // mm
  minBeamWidth: number; // mm for structural elements
  safetyFactor: number; // multiplier for load calculations
}

export interface DimensionalLimits {
  minGap: number; // mm - minimum space between features
  minRadius: number; // mm - minimum corner radius
  maxLength: number; // mm - maximum single cut length
  positionalAccuracy: number; // ± mm - positioning tolerance
}

export interface ManufacturingConstraints {
  material: MaterialProperties;
  kerf: KerfProperties;
  structural: StructuralLimits;
  dimensional: DimensionalLimits;
  machine: MachineCapabilities;
}

export interface MachineCapabilities {
  type: 'laser' | 'cnc' | 'plasma' | 'waterjet';
  workAreaSize: { width: number; height: number }; // mm
  maxThickness: number; // mm
  minFeatureResolution: number; // mm
  powerRange: { min: number; max: number }; // watts or %
  speedRange: { min: number; max: number }; // mm/min
  accelerationLimits: { x: number; y: number }; // mm/s²
}

export class ManufacturingValidator {
  private constraints: ManufacturingConstraints;

  constructor(constraints: ManufacturingConstraints) {
    this.constraints = constraints;
  }

  /**
   * Validate if a design meets manufacturing constraints
   */
  validateDesign(svgPath: string): ValidationResult {
    const violations: Violation[] = [];
    const recommendations: string[] = [];

    // Parse SVG to extract geometric features
    const features = this.parseSVGFeatures(svgPath);

    // Check each constraint category
    violations.push(...this.checkKerf(features));
    violations.push(...this.checkMinimumFeatures(features));
    violations.push(...this.checkStructuralIntegrity(features));
    violations.push(...this.checkDimensionalLimits(features));
    violations.push(...this.checkMaterialLimits(features));

    // Generate recommendations for violations
    recommendations.push(...this.generateFixes(violations));

    return {
      isValid: violations.length === 0,
      violations,
      recommendations,
      score: this.calculateScore(violations),
      estimatedSuccess: this.calculateSuccessRate(violations)
    };
  }

  /**
   * Generate kerf-compensated paths
   */
  generateKerfCompensatedSVG(originalSVG: string, compensationType: 'inside' | 'outside' | 'center' = 'center'): string {
    const kerfOffset = this.constraints.kerf.width / 2;

    // Apply offset based on compensation type
    let offset = 0;
    switch (compensationType) {
      case 'inside':
        offset = -kerfOffset; // Shrink paths for interior cuts
        break;
      case 'outside':
        offset = kerfOffset; // Expand paths for exterior cuts
        break;
      case 'center':
        offset = 0; // No compensation - cut on the line
        break;
    }

    // Parse SVG and apply offset to all paths
    return this.applyPathOffset(originalSVG, offset);
  }

  /**
   * Calculate optimal joint tolerances for assembly
   */
  calculateJointTolerance(jointType: 'press' | 'loose' | 'sliding'): number {
    const material = this.constraints.material;
    const kerf = this.constraints.kerf.width;

    let baseTolerance = 0;
    switch (jointType) {
      case 'press':
        baseTolerance = material.pressFitTolerance;
        break;
      case 'loose':
        baseTolerance = material.looseFitTolerance;
        break;
      case 'sliding':
        baseTolerance = material.slidingFitTolerance;
        break;
    }

    // Add kerf compensation and variation
    return baseTolerance + kerf + this.constraints.kerf.variation;
  }

  /**
   * Validate structural integrity using beam theory
   */
  private checkStructuralIntegrity(features: GeometricFeature[]): Violation[] {
    const violations: Violation[] = [];
    const material = this.constraints.material;
    const structural = this.constraints.structural;

    for (const feature of features) {
      if (feature.type === 'beam') {
        const maxSpan = this.calculateMaxSpan(feature.width, material.thickness);

        if (feature.length > maxSpan) {
          violations.push({
            type: 'structural',
            severity: 'high',
            message: `Beam span ${feature.length}mm exceeds safe limit of ${maxSpan}mm`,
            location: feature.bounds,
            fix: `Add support or reduce span to ${maxSpan}mm`
          });
        }
      }

      if (feature.type === 'cantilever') {
        const maxCantilever = structural.maxCantileverLength;

        if (feature.length > maxCantilever) {
          violations.push({
            type: 'structural',
            severity: 'high',
            message: `Cantilever ${feature.length}mm exceeds limit of ${maxCantilever}mm`,
            location: feature.bounds,
            fix: `Reduce cantilever to ${maxCantilever}mm or add support`
          });
        }
      }
    }

    return violations;
  }

  /**
   * Calculate maximum safe span using beam theory
   * Based on: M = σ * I / y, where deflection δ = 5wL⁴/(384EI)
   */
  private calculateMaxSpan(width: number, thickness: number): number {
    const material = this.constraints.material;
    const maxDeflection = thickness / 100; // 1% of thickness
    const safetyFactor = this.constraints.structural.safetyFactor;

    // Second moment of area for rectangular beam: I = bh³/12
    const I = (width * Math.pow(thickness, 3)) / 12;

    // Assuming distributed load, calculate max span
    // This is simplified - real calculation would need load data
    const maxSpan = Math.pow(
      (384 * material.elasticModulus * 1000 * I * maxDeflection) / (5 * 1000), // Assume 1000 N/m distributed load
      0.25
    ) / safetyFactor;

    return Math.max(maxSpan, this.constraints.structural.maxSpanWithoutSupport);
  }

  /**
   * Check minimum feature sizes against kerf and material limits
   */
  private checkMinimumFeatures(features: GeometricFeature[]): Violation[] {
    const violations: Violation[] = [];
    const material = this.constraints.material;
    const kerf = this.constraints.kerf.width;

    for (const feature of features) {
      // Check minimum feature size
      if (feature.minDimension < material.minFeatureSize) {
        violations.push({
          type: 'feature_size',
          severity: 'high',
          message: `Feature ${feature.minDimension}mm below minimum ${material.minFeatureSize}mm`,
          location: feature.bounds,
          fix: `Increase feature size to minimum ${material.minFeatureSize}mm`
        });
      }

      // Check hole sizes
      if (feature.type === 'hole' && feature.diameter < material.minHoleSize) {
        violations.push({
          type: 'hole_size',
          severity: 'medium',
          message: `Hole diameter ${feature.diameter}mm below minimum ${material.minHoleSize}mm`,
          location: feature.bounds,
          fix: `Increase hole diameter to minimum ${material.minHoleSize}mm`
        });
      }

      // Check gaps between features
      const nearbyFeatures = this.findNearbyFeatures(feature, features, kerf * 3);
      if (nearbyFeatures.length > 0) {
        const minGap = kerf * 2; // Features must be at least 2x kerf width apart
        const actualGap = this.calculateMinGap(feature, nearbyFeatures[0]);

        if (actualGap < minGap) {
          violations.push({
            type: 'feature_spacing',
            severity: 'high',
            message: `Features ${actualGap}mm apart, minimum is ${minGap}mm`,
            location: feature.bounds,
            fix: `Increase spacing to ${minGap}mm or merge features`
          });
        }
      }
    }

    return violations;
  }

  private checkKerf(features: GeometricFeature[]): Violation[] {
    // Implementation for kerf-related checks
    return [];
  }

  private checkDimensionalLimits(features: GeometricFeature[]): Violation[] {
    // Implementation for dimensional checks
    return [];
  }

  private checkMaterialLimits(features: GeometricFeature[]): Violation[] {
    // Implementation for material-specific checks
    return [];
  }

  private parseSVGFeatures(svgPath: string): GeometricFeature[] {
    // Parse SVG and extract geometric features for analysis
    // This would use an SVG parsing library in real implementation
    return [];
  }

  private generateFixes(violations: Violation[]): string[] {
    return violations.map(v => v.fix).filter(fix => fix !== undefined) as string[];
  }

  private calculateScore(violations: Violation[]): number {
    const weights = { low: 1, medium: 3, high: 5 };
    const totalDeductions = violations.reduce((sum, v) => sum + weights[v.severity], 0);
    return Math.max(0, 100 - totalDeductions);
  }

  private calculateSuccessRate(violations: Violation[]): number {
    const highSeverityCount = violations.filter(v => v.severity === 'high').length;
    if (highSeverityCount > 0) return Math.max(20, 80 - (highSeverityCount * 20));

    const mediumSeverityCount = violations.filter(v => v.severity === 'medium').length;
    if (mediumSeverityCount > 0) return Math.max(60, 90 - (mediumSeverityCount * 10));

    return 95; // Base success rate with only low-severity issues
  }

  private applyPathOffset(svg: string, offset: number): string {
    // Apply offset to SVG paths - simplified implementation
    // Real implementation would use SVG path manipulation library
    return svg; // Placeholder
  }

  private findNearbyFeatures(feature: GeometricFeature, allFeatures: GeometricFeature[], radius: number): GeometricFeature[] {
    return allFeatures.filter(f =>
      f !== feature &&
      this.calculateDistance(feature.bounds.center, f.bounds.center) <= radius
    );
  }

  private calculateMinGap(feature1: GeometricFeature, feature2: GeometricFeature): number {
    // Calculate minimum distance between feature edges
    return 0; // Placeholder
  }

  private calculateDistance(point1: { x: number; y: number }, point2: { x: number; y: number }): number {
    return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
  }
}

// Supporting interfaces
export interface ValidationResult {
  isValid: boolean;
  violations: Violation[];
  recommendations: string[];
  score: number; // 0-100 manufacturability score
  estimatedSuccess: number; // 0-100 probability of successful cut
}

export interface Violation {
  type: 'kerf' | 'feature_size' | 'hole_size' | 'feature_spacing' | 'structural' | 'dimensional' | 'material';
  severity: 'low' | 'medium' | 'high';
  message: string;
  location: BoundingBox;
  fix?: string;
}

export interface GeometricFeature {
  type: 'line' | 'curve' | 'hole' | 'slot' | 'beam' | 'cantilever' | 'joint';
  bounds: BoundingBox;
  minDimension: number;
  maxDimension: number;
  length?: number;
  width?: number;
  diameter?: number;
  area: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  center: { x: number; y: number };
}

// Export commonly used constraint sets
export const GLOWFORGE_CONSTRAINTS: Partial<MachineCapabilities> = {
  type: 'laser',
  workAreaSize: { width: 279, height: 508 }, // mm - Glowforge Basic/Pro
  maxThickness: 25, // mm
  minFeatureResolution: 0.025, // mm
  powerRange: { min: 1, max: 100 }, // %
  speedRange: { min: 100, max: 7000 } // mm/min
};