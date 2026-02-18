import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const categoryEnum = z.enum([
  'Tubes',
  'Tôles',
  'Profilés',
  'Fers pleins',
  'Divers',
  'Consommables',
  'Peinture & Diluants',
]);

const unitTypeEnum = z.enum(['BARRE', 'FEUILLE', 'PIECE', 'PAQUET', 'BOITE', 'BIDON']);

const createMaterialSchema = z.object({
  category: categoryEnum,
  subType: z.string().trim().min(1).max(100).optional(),
  materialKind: z.string().trim().min(1).max(60).optional(),
  shapeType: z.string().trim().min(1).max(60).optional(),
  dimAmm: z.coerce.number().int().positive().optional(),
  dimBmm: z.coerce.number().int().positive().optional(),
  thicknessMm: z.coerce.number().int().positive().optional(),
  sheetWidthMm: z.coerce.number().int().positive().optional(),
  sheetHeightMm: z.coerce.number().int().positive().optional(),
  packageSize: z.coerce.number().positive().optional(),
  packageUnit: z.string().trim().min(1).max(10).optional(),
  specText: z.string().trim().min(1).max(120).optional(),
  unitType: unitTypeEnum,
  unitVariant: z.string().trim().min(1).max(40).optional(),
  quantity: z.coerce.number().int().min(0).default(0),
  alertThreshold: z.coerce.number().int().min(0).default(5),
});

type CreateMaterialInput = z.infer<typeof createMaterialSchema>;

function clean(value?: string) {
  return value?.trim();
}

function mm(value?: number) {
  return value ? `${value}` : '';
}

function formatTubeShape(shapeType?: string, dimA?: number, dimB?: number) {
  const shape = (shapeType ?? '').toLowerCase();
  if (shape.includes('rond')) return `Ø${mm(dimA)}`;
  if (shape.includes('carr')) return `${mm(dimA)} x ${mm(dimA)}`;
  if (shape.includes('rect')) return `${mm(dimA)} x ${mm(dimB)}`;
  return [mm(dimA), dimB ? mm(dimB) : undefined].filter(Boolean).join(' x ');
}

function buildMaterialName(input: CreateMaterialInput) {
  const category = input.category;
  const material = clean(input.materialKind);
  const subType = clean(input.subType);
  const shapeType = clean(input.shapeType);

  if (category === 'Tubes') {
    const dims = formatTubeShape(shapeType, input.dimAmm, input.dimBmm);
    return `Tube ${shapeType ?? ''} ${material ?? ''} ${dims} x ${input.thicknessMm} mm`
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (category === 'Tôles') {
    return `Tôle ${material ?? ''} ${input.thicknessMm} mm`.replace(/\s+/g, ' ').trim();
  }

  if (category === 'Profilés') {
    const dims = [mm(input.dimAmm), mm(input.dimBmm)].filter(Boolean).join(' x ');
    return `Profilé ${subType ?? ''} ${material ?? ''} ${dims} x ${input.thicknessMm} mm`
      .replace(/\s+/g, ' ')
      .trim();
  }

  if (category === 'Fers pleins') {
    const shape = (shapeType ?? '').toLowerCase();
    if (shape.includes('rond')) {
      return `Fer plein rond ${material ?? ''} Ø${input.dimAmm} mm`.replace(/\s+/g, ' ').trim();
    }
    if (shape.includes('carr')) {
      return `Fer plein carré ${material ?? ''} ${input.dimAmm} mm`.replace(/\s+/g, ' ').trim();
    }
    if (shape.includes('plat')) {
      return `Fer plat ${material ?? ''} ${input.dimAmm} x ${input.thicknessMm} mm`
        .replace(/\s+/g, ' ')
        .trim();
    }
    return `Fer plein ${shapeType ?? ''} ${material ?? ''}`.replace(/\s+/g, ' ').trim();
  }

  if (category === 'Peinture & Diluants') {
    return `${subType ?? 'Produit'} ${clean(input.specText) ?? ''} ${input.packageSize ?? ''} ${input.packageUnit ?? ''}`
      .replace(/\s+/g, ' ')
      .trim();
  }

  return `${subType ?? category} ${clean(input.specText) ?? ''}`.replace(/\s+/g, ' ').trim();
}

function buildUnitLabel(input: CreateMaterialInput) {
  if (input.unitType === 'BARRE') {
    return input.unitVariant === 'BARRE_12M' ? 'barre 12 m' : 'barre 6 m';
  }

  if (input.unitType === 'FEUILLE') {
    if (input.unitVariant === 'FEUILLE_244X122') return 'feuille 2,44 x 1,22 m';
    if (input.unitVariant === 'FEUILLE_2X1') return 'feuille 2 x 1 m';
    if (input.unitVariant === 'FEUILLE_CUSTOM' && input.sheetWidthMm && input.sheetHeightMm) {
      return `feuille ${input.sheetWidthMm} x ${input.sheetHeightMm} mm`;
    }
    return 'feuille';
  }

  if (input.unitType === 'PAQUET') return 'paquet';
  if (input.unitType === 'PIECE') return 'pièce';
  if (input.unitType === 'BOITE') return 'boîte';
  if (input.unitType === 'BIDON') return 'bidon';

  return 'unité';
}

function buildFingerprint(input: CreateMaterialInput) {
  const parts = [
    input.category,
    clean(input.materialKind),
    clean(input.subType),
    clean(input.shapeType),
    input.dimAmm,
    input.dimBmm,
    input.thicknessMm,
    input.sheetWidthMm,
    input.sheetHeightMm,
    input.packageSize,
    clean(input.packageUnit),
    clean(input.specText),
    input.unitType,
    clean(input.unitVariant),
  ];

  return parts
    .filter((v) => v !== undefined && v !== null && v !== '')
    .map((v) => String(v).toLowerCase().replace(/\s+/g, '-'))
    .join('|');
}

function validateBusinessRules(input: CreateMaterialInput) {
  if (['Tubes', 'Profilés', 'Fers pleins'].includes(input.category)) {
    if (input.unitType !== 'BARRE') return 'Cette catégorie doit être en barre';
    if (!['BARRE_6M', 'BARRE_12M'].includes(input.unitVariant ?? '')) {
      return 'Choisissez 6 m ou 12 m pour la barre';
    }
  }

  if (input.category === 'Tôles') {
    if (input.unitType !== 'FEUILLE') return 'Les tôles doivent être en feuille';
    if (!['FEUILLE_2X1', 'FEUILLE_244X122', 'FEUILLE_CUSTOM'].includes(input.unitVariant ?? '')) {
      return 'Format de feuille invalide';
    }
    if (input.unitVariant === 'FEUILLE_CUSTOM' && (!input.sheetWidthMm || !input.sheetHeightMm)) {
      return 'Le format personnalisé de tôle nécessite largeur et hauteur';
    }
  }

  if (input.category === 'Divers' && !['PIECE', 'PAQUET'].includes(input.unitType)) {
    return 'Divers accepte uniquement pièce ou paquet';
  }

  if (input.category === 'Peinture & Diluants') {
    if (!input.packageSize || !input.packageUnit) {
      return 'Peinture & Diluants nécessite un conditionnement (kg ou L)';
    }
  }

  return null;
}

export async function listMaterials(_req: AuthenticatedRequest, res: Response) {
  const materials = await prisma.material.findMany({
    where: { active: true },
    orderBy: [{ category: 'asc' }, { name: 'asc' }],
  });
  res.json(materials);
}

export async function createMaterial(req: AuthenticatedRequest, res: Response) {
  const parsed = createMaterialSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Payload invalide', errors: parsed.error.flatten() });
  }

  const input = parsed.data;
  const businessRuleError = validateBusinessRules(input);
  if (businessRuleError) {
    return res.status(400).json({ message: businessRuleError });
  }

  const fingerprint = buildFingerprint(input);
  const existing = await prisma.material.findFirst({ where: { fingerprint } });

  if (existing) {
    return res.status(409).json({
      message: 'Cette référence existe déjà',
      existingMaterialId: existing.id,
      existingMaterialName: existing.name,
    });
  }

  const material = await prisma.material.create({
    data: {
      name: buildMaterialName(input),
      category: input.category,
      subType: clean(input.subType),
      materialKind: clean(input.materialKind),
      shapeType: clean(input.shapeType),
      dimAmm: input.dimAmm,
      dimBmm: input.dimBmm,
      thicknessMm: input.thicknessMm,
      sheetWidthMm: input.sheetWidthMm,
      sheetHeightMm: input.sheetHeightMm,
      packageSize: input.packageSize,
      packageUnit: clean(input.packageUnit),
      specText: clean(input.specText),
      unit: buildUnitLabel(input),
      unitType: input.unitType,
      unitVariant: clean(input.unitVariant),
      fingerprint,
      quantity: input.quantity,
      alertThreshold: input.alertThreshold,
      active: true,
    },
  });

  return res.status(201).json(material);
}
