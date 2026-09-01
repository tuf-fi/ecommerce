import hero from "@/images-placeholder/hero-img.jpg";
import overnightRetinolSerum from "@/images-placeholder/overnight retinol syrum.jpg";
import barrierRepairCream from "@/images-placeholder/barrier repair cream.jpg";
import quietGlowGelCream from "@/images-placeholder/quiet glow gel cream.jpg";
import theRitualEditFullSet from "@/images-placeholder/set.jpg";
import riceMilkBodyWash from "@/images-placeholder/rice milk body wash.jpg";
import vitaminCBrighteningDrop from "@/images-placeholder/vitamin c brightening drop.jpg";
import niacinamidePoreRefiner from "@/images-placeholder/niacinamide pore refiner.jpg";
import ceramideSleepBalm from "@/images-placeholder/ceramide sleep balm.jpg";
import glassSkinRoutine from "@/images-placeholder/glass skin routine.jpg";
import barrierFirst from "@/images-placeholder/barrier first.jpg";
import philosophy from "@/images-placeholder/philosophy.jpg";
import dryness from "@/images-placeholder/dryness.jpg";
import breakouts from "@/images-placeholder/breakouts.jpg";
import dullness from "@/images-placeholder/dullness.jpg";
import fineLines from "@/images-placeholder/fine lines.jpg";
import redness from "@/images-placeholder/redness.jpg";
import skinTexture from "@/images-placeholder/skin texture.jpg";
import caseForASlowerRoutine from "@/images-placeholder/case for a slower routine.jpg";
import layering from "@/images-placeholder/layering.jpg";
import journalNiacinamide from "@/images-placeholder/journal-niacinamide.jpg";
import sixWeeksInto from "@/images-placeholder/six weeks into.jpg";
import contactSection from "@/images-placeholder/contact section.jpg";
import joinTheRitual from "@/images-placeholder/join the ritual.jpg";

export const productImages = {
    "Overnight Retinol Serum": overnightRetinolSerum,
    "Barrier Repair Cream": barrierRepairCream,
    "Quiet Glow Gel Cream": quietGlowGelCream,
    "The Ritual Edit, Full Set": theRitualEditFullSet,
    "Rice Milk Body Wash": riceMilkBodyWash,
    "Vitamin C Brightening Drop": vitaminCBrighteningDrop,
    "Niacinamide Pore Refiner": niacinamidePoreRefiner,
    "Ceramide Sleep Balm": ceramideSleepBalm,
} as const;

export const ritualImages = {
    "The Glass Skin Routine": glassSkinRoutine,
    "Barrier First": barrierFirst,
} as const;

export const concernImages = {
    Dryness: dryness,
    Breakouts: breakouts,
    Dullness: dullness,
    "Fine Lines": fineLines,
    Redness: redness,
    Texture: skinTexture,
} as const;

export const journalImages = {
    "The Case for a Slower Routine": caseForASlowerRoutine,
    "Layering Order, Actually Explained": layering,
    "What Niacinamide Can (and Can't) Fix": journalNiacinamide,
    "Six Weeks Into the Ritual Edit": sixWeeksInto,
} as const;

export const heroImage = hero;
export const philosophyImage = philosophy;
export const contactImage = contactSection;
export const newsletterImage = joinTheRitual;
