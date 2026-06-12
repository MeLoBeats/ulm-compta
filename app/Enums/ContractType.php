<?php

namespace App\Enums;

enum ContractType: string
{
    case SixtyForty = '60_40';
    case SeventyThirty = '70_30';
    case EightyTwenty = '80_20';

    public function label(): string
    {
        return match ($this) {
            self::SixtyForty => '60/40',
            self::SeventyThirty => '70/30',
            self::EightyTwenty => '80/20',
        };
    }

    /** Artist percentage */
    public function artistPercentage(): int
    {
        return match ($this) {
            self::SixtyForty => 60,
            self::SeventyThirty => 70,
            self::EightyTwenty => 80,
        };
    }

    /** Label percentage (what the label keeps) */
    public function labelPercentage(): int
    {
        return 100 - $this->artistPercentage();
    }
}
