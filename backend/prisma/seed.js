import bcrypt from 'bcryptjs';
import { PrismaClient, UserRole } from '@prisma/client';
const prisma = new PrismaClient();
function fingerprint(parts) {
    return parts
        .filter((value) => value !== undefined && value !== null && value !== '')
        .map((value) => String(value).toLowerCase().replace(/\s+/g, '-'))
        .join('|');
}
async function main() {
    const adminEmail = 'kderoued@gmail.com';
    const adminFullName = 'Ouedraogo Stéphane A. K. W.';
    const adminPassword = await bcrypt.hash('Topsecret@123', 10);
    const existingOwner = await prisma.user.findFirst({ where: { isOwner: true } });
    const admin = existingOwner
        ? await prisma.user.update({
            where: { id: existingOwner.id },
            data: {
                fullName: adminFullName,
                email: adminEmail,
                passwordHash: adminPassword,
                role: UserRole.ADMIN,
                active: true,
                isOwner: true,
                isTeamLead: false,
                tokenVersion: { increment: 1 },
            },
        })
        : await prisma.user.create({
            data: {
                fullName: adminFullName,
                email: adminEmail,
                passwordHash: adminPassword,
                role: UserRole.ADMIN,
                active: true,
                isOwner: true,
                isTeamLead: false,
            },
        });
    const materialsData = [
        {
            name: 'Tube rond Acier Ø30 x 2 mm',
            category: 'Tubes',
            subType: 'Tube rond',
            materialKind: 'Acier',
            shapeType: 'Rond',
            dimAmm: 30,
            thicknessMm: 2,
            unit: 'barre 6 m',
            unitType: 'BARRE',
            unitVariant: 'BARRE_6M',
            quantity: 22,
            alertThreshold: 8,
        },
        {
            name: 'Tube rectangulaire Acier 40 x 20 x 2 mm',
            category: 'Tubes',
            subType: 'Tube rectangulaire',
            materialKind: 'Acier',
            shapeType: 'Rectangulaire',
            dimAmm: 40,
            dimBmm: 20,
            thicknessMm: 2,
            unit: 'barre 6 m',
            unitType: 'BARRE',
            unitVariant: 'BARRE_6M',
            quantity: 12,
            alertThreshold: 6,
        },
        {
            name: 'Tôle Acier 2 mm',
            category: 'Tôles',
            subType: 'Tôle',
            materialKind: 'Acier',
            thicknessMm: 2,
            sheetWidthMm: 2000,
            sheetHeightMm: 1000,
            unit: 'feuille 2 x 1 m',
            unitType: 'FEUILLE',
            unitVariant: 'FEUILLE_2X1',
            quantity: 16,
            alertThreshold: 6,
        },
        {
            name: 'Tôle Acier 2 mm',
            category: 'Tôles',
            subType: 'Tôle',
            materialKind: 'Acier',
            thicknessMm: 2,
            sheetWidthMm: 2440,
            sheetHeightMm: 1220,
            unit: 'feuille 2,44 x 1,22 m',
            unitType: 'FEUILLE',
            unitVariant: 'FEUILLE_244X122',
            quantity: 6,
            alertThreshold: 4,
        },
        {
            name: 'Profilé Cornière Acier 40 x 40 x 4 mm',
            category: 'Profilés',
            subType: 'Cornière',
            materialKind: 'Acier',
            dimAmm: 40,
            dimBmm: 40,
            thicknessMm: 4,
            unit: 'barre 6 m',
            unitType: 'BARRE',
            unitVariant: 'BARRE_6M',
            quantity: 10,
            alertThreshold: 4,
        },
        {
            name: 'Fer plein rond Acier Ø20 mm',
            category: 'Fers pleins',
            subType: 'Fer plein',
            materialKind: 'Acier',
            shapeType: 'Rond',
            dimAmm: 20,
            unit: 'barre 12 m',
            unitType: 'BARRE',
            unitVariant: 'BARRE_12M',
            quantity: 7,
            alertThreshold: 3,
        },
        {
            name: 'Grille galvanisée',
            category: 'Divers',
            subType: 'Grille',
            materialKind: 'Galvanisée',
            unit: 'pièce',
            unitType: 'PIECE',
            quantity: 9,
            alertThreshold: 3,
        },
        {
            name: 'Disque à couper Ø125',
            category: 'Consommables',
            subType: 'Disque à couper',
            shapeType: 'Rond',
            dimAmm: 125,
            specText: 'grain standard',
            unit: 'pièce',
            unitType: 'PIECE',
            quantity: 60,
            alertThreshold: 20,
        },
        {
            name: 'Peinture antirouille 3 kg',
            category: 'Peinture & Diluants',
            subType: 'Peinture',
            specText: 'Antirouille',
            packageSize: 3,
            packageUnit: 'kg',
            unit: 'boîte',
            unitType: 'BOITE',
            quantity: 14,
            alertThreshold: 5,
        },
        {
            name: 'Diluant synthétique 5 L',
            category: 'Peinture & Diluants',
            subType: 'Diluant',
            specText: 'Synthétique',
            packageSize: 5,
            packageUnit: 'L',
            unit: 'bidon',
            unitType: 'BIDON',
            quantity: 8,
            alertThreshold: 4,
        },
    ];
    for (const material of materialsData) {
        const key = fingerprint([
            material.category,
            material.materialKind,
            material.subType,
            material.shapeType,
            material.dimAmm,
            material.dimBmm,
            material.thicknessMm,
            material.sheetWidthMm,
            material.sheetHeightMm,
            material.packageSize,
            material.packageUnit,
            material.specText,
            material.unitType,
            material.unitVariant,
        ]);
        const existing = await prisma.material.findFirst({ where: { fingerprint: key } });
        if (existing) {
            await prisma.material.update({
                where: { id: existing.id },
                data: {
                    ...material,
                    fingerprint: key,
                    active: true,
                },
            });
        }
        else {
            await prisma.material.create({
                data: {
                    ...material,
                    fingerprint: key,
                    active: true,
                },
            });
        }
    }
    console.log('✅ Seed terminé.');
    console.log('Admin:', admin.email, '/ mot de passe: Topsecret@123');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
