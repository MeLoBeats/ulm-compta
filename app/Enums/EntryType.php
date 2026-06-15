<?php

namespace App\Enums;

enum EntryType: string
{
    case Revenue = 'revenue';
    case DeductibleExpense = 'deductible_expense';
    case NonDeductibleExpense = 'non_deductible_expense';

    public function label(): string
    {
        return match ($this) {
            self::Revenue => 'Revenus',
            self::DeductibleExpense => 'Dépenses déductibles',
            self::NonDeductibleExpense => 'Dépenses non déductibles',
        };
    }

    /** @return array<string, string> */
    public function categories(): array
    {
        return match ($this) {
            self::Revenue => [
                'ca' => "Chiffre d'affaires (CA)",
                'autres_revenus' => 'Autres revenus',
                'dons_recus' => 'Dons reçus',
                'sacem' => 'SACEM',
                'caution_encaissee' => 'Caution encaissée',
            ],
            self::DeductibleExpense => [
                'salaires' => 'Salaires',
                'prime_hebdomadaire' => 'Prime hebdomadaire',
                'prime_mensuelle' => 'Prime mensuelle',
                'matiere_premiere' => 'Matière première',
                'nourriture' => 'Nourriture',
                'frais_avocat_comptable' => "Frais d'avocat/comptable",
                'locations' => 'Locations',
                'achats_vehicules' => 'Achats véhicules',
                'frais_vehicules' => 'Frais véhicules',
                'caution_remboursee' => 'Caution remboursée',
                'dons_verses' => 'Dons versés',
            ],
            self::NonDeductibleExpense => [
                'locations_nd' => 'Locations',
                'achats_vehicules_nd' => 'Achats véhicules',
                'autres_nd' => 'Autres',
            ],
        };
    }

    /** @return string[] */
    public static function allCategoryKeys(): array
    {
        return array_merge(
            array_keys(self::Revenue->categories()),
            array_keys(self::DeductibleExpense->categories()),
            array_keys(self::NonDeductibleExpense->categories()),
        );
    }
}
