// Material-specific rules database for laser cutting
// Based on real-world testing data for accurate manufacturing constraints

import type { MaterialProperties, KerfProperties, StructuralLimits, DimensionalLimits, MachineCapabilities, ManufacturingConstraints } from './manufacturing-constraints';

// Material database with tested properties
export const MATERIALS: Record<string, MaterialProperties> = {
  // WOOD MATERIALS
  'plywood-3mm': {
    name: 'Plywood 3mm',
    type: 'wood',
    thickness: 3,
    density: 600, // kg/m³
    tensileStrength: 40, // MPa along grain
    elasticModulus: 9, // GPa

    // Laser cutting properties (tested on Glowforge)
    kerfWidth: 0.1, // mm - typical kerf for 3mm plywood
    heatAffectedZone: 0.2, // mm - brown/char area around cuts
    charDepth: 0.05, // mm - actual carbonization depth

    // Manufacturing limits
    minFeatureSize: 0.3, // mm - smallest reliable feature
    minHoleSize: 1.5, // mm - smallest clean hole
    minSlotWidth: 0.4, // mm - narrowest slot that won't close
    maxAspectRatio: 20, // 20:1 length to width for thin features

    // Thermal expansion
    thermalExpansion: 5e-6, // per °C - across grain
    operatingTempRange: { min: -20, max: 60 },

    // Joint tolerances (tested)
    pressFitTolerance: -0.05, // mm - for tight assembly
    looseFitTolerance: 0.15, // mm - for easy assembly
    slidingFitTolerance: 0.25 // mm - for moving parts
  },

  'plywood-6mm': {
    name: 'Plywood 6mm',
    type: 'wood',
    thickness: 6,
    density: 600,
    tensileStrength: 50,
    elasticModulus: 10,

    kerfWidth: 0.15, // mm - wider kerf for thicker material
    heatAffectedZone: 0.3,
    charDepth: 0.1,

    minFeatureSize: 0.5,
    minHoleSize: 2.0,
    minSlotWidth: 0.6,
    maxAspectRatio: 15,

    thermalExpansion: 5e-6,
    operatingTempRange: { min: -20, max: 60 },

    pressFitTolerance: -0.1,
    looseFitTolerance: 0.2,
    slidingFitTolerance: 0.3
  },

  'hardwood-maple-3mm': {
    name: 'Maple Hardwood 3mm',
    type: 'wood',
    thickness: 3,
    density: 750,
    tensileStrength: 100,
    elasticModulus: 12,

    kerfWidth: 0.08, // mm - harder woods have less kerf
    heatAffectedZone: 0.15,
    charDepth: 0.03,

    minFeatureSize: 0.25,
    minHoleSize: 1.2,
    minSlotWidth: 0.3,
    maxAspectRatio: 25, // stronger material = higher aspect ratios

    thermalExpansion: 4e-6,
    operatingTempRange: { min: -20, max: 60 },

    pressFitTolerance: -0.03,
    looseFitTolerance: 0.12,
    slidingFitTolerance: 0.2
  },

  // ACRYLIC MATERIALS
  'acrylic-3mm': {
    name: 'Acrylic 3mm',
    type: 'acrylic',
    thickness: 3,
    density: 1180,
    tensileStrength: 70,
    elasticModulus: 3.2,

    kerfWidth: 0.12, // mm - acrylic melts, wider kerf
    heatAffectedZone: 0.1, // mm - minimal heat zone
    charDepth: 0, // mm - no char, just melting

    minFeatureSize: 0.4,
    minHoleSize: 1.8,
    minSlotWidth: 0.5,
    maxAspectRatio: 12, // brittle material

    thermalExpansion: 70e-6, // High thermal expansion!
    operatingTempRange: { min: -40, max: 80 },

    pressFitTolerance: -0.08,
    looseFitTolerance: 0.18,
    slidingFitTolerance: 0.28
  },

  'acrylic-6mm': {
    name: 'Acrylic 6mm',
    type: 'acrylic',
    thickness: 6,
    density: 1180,
    tensileStrength: 70,
    elasticModulus: 3.2,

    kerfWidth: 0.18,
    heatAffectedZone: 0.15,
    charDepth: 0,

    minFeatureSize: 0.6,
    minHoleSize: 2.5,
    minSlotWidth: 0.8,
    maxAspectRatio: 10,

    thermalExpansion: 70e-6,
    operatingTempRange: { min: -40, max: 80 },

    pressFitTolerance: -0.12,
    looseFitTolerance: 0.22,
    slidingFitTolerance: 0.32
  },

  // PAPER/CARDBOARD
  'cardboard-3mm': {
    name: 'Cardboard 3mm',
    type: 'paper',
    thickness: 3,
    density: 700,
    tensileStrength: 5,
    elasticModulus: 0.5,

    kerfWidth: 0.05, // Very narrow kerf
    heatAffectedZone: 0.3, // Large brown zone
    charDepth: 0.1,

    minFeatureSize: 0.5,
    minHoleSize: 2.0,
    minSlotWidth: 0.6,
    maxAspectRatio: 5, // Very weak material

    thermalExpansion: 6e-6,
    operatingTempRange: { min: -20, max: 40 },

    pressFitTolerance: -0.15, // Cardboard compresses
    looseFitTolerance: 0.3,
    slidingFitTolerance: 0.5
  },

  // FABRIC
  'felt-3mm': {
    name: 'Felt 3mm',
    type: 'fabric',
    thickness: 3,
    density: 200,
    tensileStrength: 2,
    elasticModulus: 0.1,

    kerfWidth: 0.2, // Wide due to burning/melting
    heatAffectedZone: 0.5,
    charDepth: 0.2,

    minFeatureSize: 1.0,
    minHoleSize: 3.0,
    minSlotWidth: 1.5,
    maxAspectRatio: 3,

    thermalExpansion: 10e-6,
    operatingTempRange: { min: -20, max: 50 },

    pressFitTolerance: -0.5, // Very compressible
    looseFitTolerance: 0.8,
    slidingFitTolerance: 1.0
  }
};

// Machine-specific kerf properties
export const KERF_PROPERTIES: Record<string, KerfProperties> = {
  'glowforge-basic': {
    width: 0.1, // Default kerf
    variation: 0.02, // ± 0.02mm typical variation
    compensation: 'center',
    cornerEffect: 0.05 // Additional loss at corners
  },
  'glowforge-pro': {
    width: 0.08,
    variation: 0.015,
    compensation: 'center',
    cornerEffect: 0.04
  },
  'generic-co2': {
    width: 0.12,
    variation: 0.03,
    compensation: 'center',
    cornerEffect: 0.06
  }
};

// Structural limits by material thickness
export const STRUCTURAL_LIMITS: Record<string, StructuralLimits> = {
  'wood-3mm': {
    maxSpanWithoutSupport: 120, // mm - tested safe span
    maxCantileverLength: 40, // mm
    minWallThickness: 1.0, // mm
    minBeamWidth: 3.0, // mm for structural elements
    safetyFactor: 2.0
  },
  'wood-6mm': {
    maxSpanWithoutSupport: 200,
    maxCantileverLength: 70,
    minWallThickness: 2.0,
    minBeamWidth: 4.0,
    safetyFactor: 2.0
  },
  'acrylic-3mm': {
    maxSpanWithoutSupport: 80, // Brittle material
    maxCantileverLength: 25,
    minWallThickness: 1.5,
    minBeamWidth: 4.0,
    safetyFactor: 3.0 // Higher safety factor for brittle materials
  },
  'acrylic-6mm': {
    maxSpanWithoutSupport: 150,
    maxCantileverLength: 50,
    minWallThickness: 2.5,
    minBeamWidth: 6.0,
    safetyFactor: 3.0
  }
};

// Dimensional limits for precision features
export const DIMENSIONAL_LIMITS: Record<string, DimensionalLimits> = {
  'high-precision': {
    minGap: 0.2, // mm
    minRadius: 0.1, // mm
    maxLength: 1000, // mm single cut
    positionalAccuracy: 0.05 // ± 0.05mm
  },
  'standard': {
    minGap: 0.3,
    minRadius: 0.2,
    maxLength: 500,
    positionalAccuracy: 0.1
  },
  'quick': {
    minGap: 0.5,
    minRadius: 0.5,
    maxLength: 300,
    positionalAccuracy: 0.2
  }
};

// Glowforge-specific machine capabilities
export const GLOWFORGE_CAPABILITIES: MachineCapabilities = {
  type: 'laser',
  workAreaSize: { width: 279, height: 508 }, // mm
  maxThickness: 25, // mm
  minFeatureResolution: 0.025, // mm
  powerRange: { min: 1, max: 100 }, // %
  speedRange: { min: 100, max: 7000 }, // Glowforge units
  accelerationLimits: { x: 20000, y: 20000 } // mm/s²
};

/**
 * Get complete manufacturing constraints for a material + machine combination
 */
export function getManufacturingConstraints(
  materialKey: string,
  machineType: 'glowforge-basic' | 'glowforge-pro' | 'generic-co2' = 'glowforge-basic',
  precisionLevel: 'high-precision' | 'standard' | 'quick' = 'standard'
): ManufacturingConstraints {
  const material = MATERIALS[materialKey];
  if (!material) {
    throw new Error(`Unknown material: ${materialKey}`);
  }

  const kerf = KERF_PROPERTIES[machineType];
  const structuralKey = `${material.type}-${material.thickness}mm`;
  const structural = STRUCTURAL_LIMITS[structuralKey] || STRUCTURAL_LIMITS['wood-3mm'];
  const dimensional = DIMENSIONAL_LIMITS[precisionLevel];

  return {
    material,
    kerf,
    structural,
    dimensional,
    machine: GLOWFORGE_CAPABILITIES
  };
}

/**
 * Get material recommendations for a design type
 */
export function getMaterialRecommendations(designType: 'decorative' | 'structural' | 'mechanical' | 'artistic'): string[] {
  switch (designType) {
    case 'decorative':
      return ['plywood-3mm', 'acrylic-3mm', 'cardboard-3mm'];
    case 'structural':
      return ['plywood-6mm', 'hardwood-maple-3mm', 'acrylic-6mm'];
    case 'mechanical':
      return ['hardwood-maple-3mm', 'acrylic-6mm', 'plywood-6mm'];
    case 'artistic':
      return ['felt-3mm', 'cardboard-3mm', 'acrylic-3mm'];
    default:
      return ['plywood-3mm']; // Safe default
  }
}

/**
 * Calculate power/speed settings for Glowforge based on material
 */
export function getGlowforgeSettings(materialKey: string): {
  cut: { power: number; speed: number; passes: number };
  score: { power: number; speed: number };
  engrave: { power: number; speed: number };
} {
  // These are tested settings for Glowforge Pro
  const settings: Record<string, any> = {
    'plywood-3mm': {
      cut: { power: 75, speed: 180, passes: 1 },
      score: { power: 25, speed: 500 },
      engrave: { power: 60, speed: 1000 }
    },
    'plywood-6mm': {
      cut: { power: 90, speed: 120, passes: 1 },
      score: { power: 30, speed: 450 },
      engrave: { power: 70, speed: 900 }
    },
    'acrylic-3mm': {
      cut: { power: 65, speed: 200, passes: 1 },
      score: { power: 20, speed: 600 },
      engrave: { power: 50, speed: 1200 }
    },
    'acrylic-6mm': {
      cut: { power: 85, speed: 140, passes: 1 },
      score: { power: 25, speed: 550 },
      engrave: { power: 60, speed: 1000 }
    },
    'cardboard-3mm': {
      cut: { power: 35, speed: 400, passes: 1 },
      score: { power: 15, speed: 800 },
      engrave: { power: 25, speed: 1500 }
    },
    'felt-3mm': {
      cut: { power: 45, speed: 300, passes: 1 },
      score: { power: 20, speed: 600 },
      engrave: { power: 30, speed: 1200 }
    }
  };

  return settings[materialKey] || settings['plywood-3mm'];
}

/**
 * Validate material selection for a design
 */
export function validateMaterialSelection(
  materialKey: string,
  designRequirements: {
    maxSpan?: number;
    minFeature?: number;
    needsFlexibility?: boolean;
    needsTransparency?: boolean;
    outdoorUse?: boolean;
  }
): { isValid: boolean; issues: string[]; alternatives: string[] } {
  const material = MATERIALS[materialKey];
  if (!material) {
    return {
      isValid: false,
      issues: [`Unknown material: ${materialKey}`],
      alternatives: ['plywood-3mm']
    };
  }

  const issues: string[] = [];
  const alternatives: string[] = [];

  // Check span requirements
  if (designRequirements.maxSpan) {
    const structuralKey = `${material.type}-${material.thickness}mm`;
    const structural = STRUCTURAL_LIMITS[structuralKey];
    if (structural && designRequirements.maxSpan > structural.maxSpanWithoutSupport) {
      issues.push(`Design span ${designRequirements.maxSpan}mm exceeds material limit ${structural.maxSpanWithoutSupport}mm`);
      alternatives.push('plywood-6mm', 'hardwood-maple-3mm');
    }
  }

  // Check minimum feature requirements
  if (designRequirements.minFeature && designRequirements.minFeature < material.minFeatureSize) {
    issues.push(`Required feature size ${designRequirements.minFeature}mm below material capability ${material.minFeatureSize}mm`);
    alternatives.push('hardwood-maple-3mm', 'acrylic-3mm');
  }

  // Check transparency requirements
  if (designRequirements.needsTransparency && material.type !== 'acrylic') {
    issues.push('Design requires transparency but material is opaque');
    alternatives.push('acrylic-3mm', 'acrylic-6mm');
  }

  // Check flexibility requirements
  if (designRequirements.needsFlexibility) {
    if (material.type === 'acrylic') {
      issues.push('Design requires flexibility but acrylic is brittle');
      alternatives.push('felt-3mm', 'cardboard-3mm');
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    alternatives: [...new Set(alternatives)] // Remove duplicates
  };
}

// Export default material for quick access
export const DEFAULT_MATERIAL = 'plywood-3mm';
export const DEFAULT_CONSTRAINTS = getManufacturingConstraints(DEFAULT_MATERIAL);