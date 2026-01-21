<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Tests\Fixtures;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;

class User extends Authenticatable
{
    use HasFactory;

    protected $guarded = [];

    protected static function newFactory(): UserFactory
    {
        return UserFactory::new();
    }
}
