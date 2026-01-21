<?php

namespace Pjedesigns\FilamentMetaLexicalEditor\Tests;

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Schema;
use Orchestra\Testbench\TestCase as Orchestra;
use Pjedesigns\FilamentMetaLexicalEditor\FilamentMetaLexicalEditorServiceProvider;

class TestCase extends Orchestra
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->setUpDatabase();
        $this->setUpRoutes();
    }

    protected function getPackageProviders($app): array
    {
        return [
            FilamentMetaLexicalEditorServiceProvider::class,
        ];
    }

    public function getEnvironmentSetUp($app): void
    {
        config()->set('app.key', 'base64:'.base64_encode(random_bytes(32)));

        config()->set('database.default', 'testing');
        config()->set('database.connections.testing', [
            'driver' => 'sqlite',
            'database' => ':memory:',
            'prefix' => '',
        ]);
    }

    protected function setUpDatabase(): void
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');
            $table->timestamps();
        });
    }

    protected function setUpRoutes(): void
    {
        Route::get('/login', fn () => 'Login')->name('login');
    }
}
