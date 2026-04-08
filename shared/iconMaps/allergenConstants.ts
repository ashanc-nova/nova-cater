import React from 'react';

import { MilkIcon } from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/MilkIcon';
import EggIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/EggIcon';
import FishIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/FishIcon';
import ShrimpIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/ShrimpIcon';
import ShellIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/ShellIcon';
import NutsIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/NutsIcon';
import GlutenIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/GlutenIcon';
import SoyIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/SoyIcon';
import SesameIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/SesameIcon';
import MustardIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/MustardIcon';
import CeleryIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/CeleryIcon';
import SulphitesIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/SulphitesIcon';
import TreenutsIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/TreenutsIcon';

import DefaultAllergenIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/DefaultAllergenIconOOS';
import TreenutsIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/TreenutsIconOOS';          
import SulphitesIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/SulphitesIconOOS';
import CeleryIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/CeleryIconOOS';
import MustardIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/MustardIcon';
import SesameIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/SesameIconOOS';
import SoyIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/SoyIconOOS';
import GlutenIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/GlutenIconOOS';
    import NutsIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/NutsIconOOS';
import EggsOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/EggsOOS';
import FishIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/FishIconOOS';
import MilkIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/MilkIconOOS';
import ShellIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/ShellIconOOS';
import ShrimpIconOOS from '../../assets/Icons/allergensIcons/OutofStockVersion/ShrimpIconOOS';

import PeanutsIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/PeanutsIconNE';
import GlutenIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/GlutenIconNE';
import MustardIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/MustardIconNE';
import SoyIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/SoyIconNE';
import SesameIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/SesameIconNE';
import CeleryIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/CeleryIconNE';
import SulphitesIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/SulphitesIconNE';
import TreenutsIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/TreenutsIconNE';
import MilkIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/MilkIconNE';
import FishIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/FishIconNE';
import EggsIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/EggsIconNE';
import { ShellFishIconNE } from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/ShellFishIconNE';
import MollusksIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/MollusksIconNE';
import DefaultAllergenIconNE from '../../assets/Icons/allergensIcons/NonEnclosedAllergansIcons/DefaultAllergenIconNE';
import DefaultAllergenIcon from '../../assets/Icons/allergensIcons/EnclosedAllergensIcons/DefaultAllergenIcon';

export type AllergenIconComponent = React.FC<{ size?: number; className?: string }>;

export const ALLERGEN_ICON_MAP: Record<string, AllergenIconComponent> = {
  milk: MilkIcon,
  eggs: EggIcon,
  fish: FishIcon,
  shellfish: ShrimpIcon,
  molluscs: ShellIcon,
  peanuts: NutsIcon,
  gluten: GlutenIcon,
  soy: SoyIcon,
  sesame: SesameIcon,
  mustard: MustardIcon,
  celery: CeleryIcon,
  sulphites: SulphitesIcon,
  treenuts: TreenutsIcon,
};

export const NON_CLOSED_ALLERGEN_ICON_MAP: Record<string, AllergenIconComponent> = {
  milk: MilkIconNE,
  eggs: EggsIconNE,
  fish: FishIconNE,
  shellfish: ShellFishIconNE,
  molluscs: MollusksIconNE,
  peanuts: PeanutsIconNE,
  gluten: GlutenIconNE,
  soy: SoyIconNE,
  sesame: SesameIconNE,
  mustard: MustardIconNE,
  celery: CeleryIconNE,
  sulphites: SulphitesIconNE,
  treenuts: TreenutsIconNE,
  default: DefaultAllergenIconNE,
};

export const ALLERGEN_ICON_OOS_MAP: Record<string, AllergenIconComponent> = {
  milk: MilkIconOOS,
  eggs: EggsOOS,
  fish: FishIconOOS,
  shellfish: ShrimpIconOOS,
  molluscs: ShellIconOOS,
  peanuts: NutsIconOOS,
  gluten: GlutenIconOOS,
  soy: SoyIconOOS,
  sesame: SesameIconOOS,
  mustard: MustardIconOOS,
  celery: CeleryIconOOS,
  sulphites: SulphitesIconOOS,
  treenuts: TreenutsIconOOS,
  default: DefaultAllergenIconOOS,
};

export const ALLERGEN_NAME_MAPPING: Record<string, string> = {
  'dairy (milk)': 'milk',
  'tree nuts': 'treenuts',
  'wheat / gluten': 'gluten',
};