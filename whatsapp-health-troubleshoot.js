// ========================================
// health-check.js - Verificação Completa do Sistema
// ========================================

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const { Client } = require('pg');
const redis = require('redis');

// Cores para console
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class SystemHealthCheck {
    constructor() {
        this.results = {
            system: {},
            dependencies: {},
            services: {},
            files: {},
            network: {},
            overall: 'checking'
        };
        this.errors = [];
        this.warnings = [];
    }

    log(message, type = 'info') {
        const prefix = {
            info: `${colors.blue}ℹ️ `,
            success: `${colors.green}✅ `,
            warning: `${colors.yellow}⚠️  `,
            error: `${colors.red}❌ `,
            checking: `${colors.cyan}🔍 `
        };
        
        console.log(`${prefix[type] || ''}${message}${colors.reset}`);
    }

    async run() {
        console.clear();
        console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════╗`);
        console.log(`║          WhatsApp Backend - System Health Check          ║`);
        console.log(`╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        await this.checkSystem();
        await this.checkDependencies();
        await this.checkServices();
        await this.checkFiles();
        await this.checkNetwork();
        await this.checkDatabase();
        await this.checkRedis();
        await this.checkApi();
        
        this.generateReport();
    }

    async checkSystem() {
        this.log('Verificando sistema operacional...', 'checking');
        
        try {
            // OS Info
            const platform = process.platform;
            const arch = process.arch;
            const nodeVersion = process.version;
            const npmVersion = execSync('npm -v').toString().trim();
            
            // Memory
            const totalMem = (require('os').totalmem() / 1024 / 1024 / 1024).toFixed(2);
            const freeMem = (require('os').freemem() / 1024 / 1024 / 1024).toFixed(2);
            
            // CPU
            const cpus = require('os').cpus().length;
            
            this.results.system = {
                platform,
                arch,
                nodeVersion,
                npmVersion,
                memory: `${freeMem}GB livres de ${totalMem}GB`,
                cpus: `${cpus} cores`
            };
            
            // Verificar versão do Node
            const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
            if (majorVersion < 18) {
                this.errors.push(`Node.js ${nodeVersion} - Requer v18 ou superior`);
                this.log(`Node.js ${nodeVersion} - Versão incompatível`, 'error');
            } else {
                this.log(`Node.js ${nodeVersion}`, 'success');
            }
            
            // Verificar memória
            const freeMemNum = parseFloat(freeMem);
            if (freeMemNum < 1) {
                this.warnings.push('Memória RAM baixa (< 1GB livre)');
                this.log('Memória RAM baixa', 'warning');
            } else {
                this.log(`Memória: ${freeMem}GB livres`, 'success');
            }
            
        } catch (error) {
            this.errors.push(`Erro ao verificar sistema: ${error.message}`);
            this.log('Erro ao verificar sistema', 'error');
        }
    }

    async checkDependencies() {
        this.log('\nVerificando dependências...', 'checking');
        
        const requiredCommands = [
            { cmd: 'git --version', name: 'Git' },
            { cmd: 'psql --version', name: 'PostgreSQL' },
            { cmd: 'redis-cli --version', name: 'Redis' },
            { cmd: 'docker --version', name: 'Docker', optional: true }
        ];
        
        for (const { cmd, name, optional } of requiredCommands) {
            try {
                const version = execSync(cmd, { stdio: 'pipe' }).toString().trim();
                this.results.dependencies[name] = version;
                this.log(`${name} instalado`, 'success');
            } catch (error) {
                if (optional) {
                    this.warnings.push(`${name} não instalado (opcional)`);
                    this.log(`${name} não instalado (opcional)`, 'warning');
                } else {
                    this.errors.push(`${name} não instalado`);
                    this.log(`${name} não instalado`, 'error');
                }
                this.results.dependencies[name] = 'Não instalado';
            }
        }
    }

    async checkServices() {
        this.log('\nVerificando serviços...', 'checking');
        
        // Verificar PostgreSQL
        try {
            if (process.platform === 'win32') {
                execSync('sc query postgresql', { stdio: 'pipe' });
            } else {
                execSync('systemctl is-active postgresql', { stdio: 'pipe' });
            }
            this.results.services.postgresql = 'Rodando';
            this.log('PostgreSQL rodando', 'success');
        } catch (error) {
            this.results.services.postgresql = 'Parado';
            this.errors.push('PostgreSQL não está rodando');
            this.log('PostgreSQL não está rodando', 'error');
        }
        
        // Verificar Redis
        try {
            if (process.platform === 'win32') {
                execSync('sc query redis', { stdio: 'pipe' });
            } else {
                execSync('systemctl is-active redis-server || systemctl is-active redis', { stdio: 'pipe' });
            }
            this.results.services.redis = 'Rodando';
            this.log('Redis rodando', 'success');
        } catch (error) {
            this.results.services.redis = 'Parado';
            this.errors.push('Redis não está rodando');
            this.log('Redis não está rodando', 'error');
        }
    }

    async checkFiles() {
        this.log('\nVerificando arquivos do projeto...', 'checking');
        
        const requiredFiles = [
            { path: '.env', critical: true },
            { path: 'package.json', critical: true },
            { path: 'prisma/schema.prisma', critical: true },
            { path: 'node_modules', critical: true, isDir: true },
            { path: 'logs', critical: false, isDir: true },
            { path: 'uploads', critical: false, isDir: true }
        ];
        
        for (const { path: filePath, critical, isDir } of requiredFiles) {
            const exists = fs.existsSync(filePath);
            
            if (exists) {
                this.results.files[filePath] = 'Existe';
                this.log(`${filePath} encontrado`, 'success');
                
                // Verificações adicionais
                if (filePath === '.env') {
                    this.checkEnvFile();
                }
                if (filePath === 'node_modules') {
                    this.checkNodeModules();
                }
            } else {
                this.results.files[filePath] = 'Não existe';
                
                if (critical) {
                    this.errors.push(`Arquivo/diretório crítico não encontrado: ${filePath}`);
                    this.log(`${filePath} não encontrado`, 'error');
                } else {
                    this.warnings.push(`Arquivo/diretório não encontrado: ${filePath}`);
                    this.log(`${filePath} não encontrado (opcional)`, 'warning');
                    
                    // Criar diretórios opcionais
                    if (isDir) {
                        fs.mkdirSync(filePath, { recursive: true });
                        this.log(`${filePath} criado`, 'info');
                    }
                }
            }
        }
    }

    checkEnvFile() {
        const envContent = fs.readFileSync('.env', 'utf8');
        const requiredVars = [
            'DATABASE_URL',
            'JWT_SECRET',
            'REDIS_HOST',
            'PORT'
        ];
        
        const missingVars = [];
        for (const varName of requiredVars) {
            if (!envContent.includes(`${varName}=`)) {
                missingVars.push(varName);
            }
        }
        
        if (missingVars.length > 0) {
            this.warnings.push(`Variáveis faltando no .env: ${missingVars.join(', ')}`);
            this.log(`Variáveis faltando no .env: ${missingVars.join(', ')}`, 'warning');
        }
    }

    checkNodeModules() {
        try {
            const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
            const dependencies = Object.keys(packageJson.dependencies || {});
            
            let missingPackages = [];
            for (const dep of dependencies.slice(0, 5)) { // Verificar apenas 5 principais
                if (!fs.existsSync(`node_modules/${dep}`)) {
                    missingPackages.push(dep);
                }
            }
            
            if (missingPackages.length > 0) {
                this.warnings.push('Algumas dependências podem estar faltando');
                this.log('Execute: npm install', 'warning');
            }
        } catch (error) {
            this.warnings.push('Não foi possível verificar dependências');
        }
    }

    async checkNetwork() {
        this.log('\nVerificando conectividade de rede...', 'checking');
        
        const ports = [
            { port: 3000, service: 'API', critical: true },
            { port: 5432, service: 'PostgreSQL', critical: true },
            { port: 6379, service: 'Redis', critical: true }
        ];
        
        for (const { port, service, critical } of ports) {
            const isOpen = await this.checkPort('localhost', port);
            
            if (isOpen) {
                this.results.network[service] = `Porta ${port} aberta`;
                this.log(`${service} (porta ${port}) acessível`, 'success');
            } else {
                this.results.network[service] = `Porta ${port} fechada`;
                
                if (port === 3000) {
                    this.log(`${service} (porta ${port}) não acessível - API não está rodando`, 'warning');
                } else if (critical) {
                    this.errors.push(`${service} não acessível na porta ${port}`);
                    this.log(`${service} (porta ${port}) não acessível`, 'error');
                }
            }
        }
    }

    checkPort(host, port) {
        return new Promise((resolve) => {
            const socket = new require('net').Socket();
            socket.setTimeout(1000);
            
            socket.on('connect', () => {
                socket.destroy();
                resolve(true);
            });
            
            socket.on('timeout', () => {
                socket.destroy();
                resolve(false);
            });
            
            socket.on('error', () => {
                resolve(false);
            });
            
            socket.connect(port, host);
        });
    }

    async checkDatabase() {
        this.log('\nTestando conexão com banco de dados...', 'checking');
        
        if (!fs.existsSync('.env')) {
            this.log('Arquivo .env não encontrado - pulando teste de DB', 'warning');
            return;
        }
        
        try {
            // Ler DATABASE_URL do .env
            const envContent = fs.readFileSync('.env', 'utf8');
            const dbUrlMatch = envContent.match(/DATABASE_URL="?([^"\n]+)"?/);
            
            if (!dbUrlMatch) {
                this.warnings.push('DATABASE_URL não encontrada no .env');
                this.log('DATABASE_URL não configurada', 'warning');
                return;
            }
            
            const databaseUrl = dbUrlMatch[1];
            const client = new Client({ connectionString: databaseUrl });
            
            await client.connect();
            const result = await client.query('SELECT NOW()');
            await client.end();
            
            this.results.services.databaseConnection = 'OK';
            this.log('Conexão com banco de dados OK', 'success');
        } catch (error) {
            this.errors.push(`Erro ao conectar ao banco: ${error.message}`);
            this.log(`Erro ao conectar ao banco: ${error.message}`, 'error');
            this.results.services.databaseConnection = 'Erro';
        }
    }

    async checkRedis() {
        this.log('\nTestando conexão com Redis...', 'checking');
        
        try {
            const client = redis.createClient({
                socket: {
                    host: 'localhost',
                    port: 6379
                }
            });
            
            await client.connect();
            await client.ping();
            await client.quit();
            
            this.results.services.redisConnection = 'OK';
            this.log('Conexão com Redis OK', 'success');
        } catch (error) {
            this.warnings.push('Redis não acessível (pode estar sem senha)');
            this.log('Redis não acessível', 'warning');
            this.results.services.redisConnection = 'Erro';
        }
    }

    async checkApi() {
        this.log('\nTestando API...', 'checking');
        
        const isApiRunning = await this.checkPort('localhost', 3000);
        
        if (!isApiRunning) {
            this.log('API não está rodando', 'warning');
            this.results.services.api = 'Não rodando';
            return;
        }
        
        return new Promise((resolve) => {
            http.get('http://localhost:3000/health', (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const health = JSON.parse(data);
                        if (health.status === 'OK') {
                            this.results.services.api = 'Rodando e saudável';
                            this.log('API rodando e saudável', 'success');
                        } else {
                            this.results.services.api = 'Rodando com problemas';
                            this.warnings.push('API rodando mas com problemas');
                            this.log('API com problemas', 'warning');
                        }
                    } catch (error) {
                        this.results.services.api = 'Erro ao verificar';
                        this.warnings.push('API rodando mas health check falhou');
                        this.log('Health check falhou', 'warning');
                    }
                    resolve();
                });
            }).on('error', (err) => {
                this.results.services.api = 'Erro';
                this.log(`Erro ao acessar API: ${err.message}`, 'error');
                resolve();
            });
        });
    }

    generateReport() {
        console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bright}                    RELATÓRIO FINAL${colors.reset}`);
        console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
        
        // Determinar status geral
        if (this.errors.length === 0 && this.warnings.length === 0) {
            this.results.overall = 'healthy';
            console.log(`${colors.green}✅ SISTEMA SAUDÁVEL - Tudo funcionando perfeitamente!${colors.reset}\n`);
        } else if (this.errors.length === 0) {
            this.results.overall = 'warning';
            console.log(`${colors.yellow}⚠️  SISTEMA FUNCIONAL - Com alguns avisos${colors.reset}\n`);
        } else {
            this.results.overall = 'error';
            console.log(`${colors.red}❌ SISTEMA COM PROBLEMAS - Correções necessárias${colors.reset}\n`);
        }
        
        // Mostrar erros
        if (this.errors.length > 0) {
            console.log(`${colors.red}Erros Críticos (${this.errors.length}):${colors.reset}`);
            this.errors.forEach((error, i) => {
                console.log(`  ${i + 1}. ${error}`);
            });
            console.log();
        }
        
        // Mostrar avisos
        if (this.warnings.length > 0) {
            console.log(`${colors.yellow}Avisos (${this.warnings.length}):${colors.reset}`);
            this.warnings.forEach((warning, i) => {
                console.log(`  ${i + 1}. ${warning}`);
            });
            console.log();
        }
        
        // Ações recomendadas
        this.suggestActions();
        
        // Salvar relatório
        this.saveReport();
    }

    suggestActions() {
        console.log(`${colors.cyan}📋 Ações Recomendadas:${colors.reset}`);
        
        const actions = [];
        
        // Baseado nos erros
        if (this.errors.some(e => e.includes('PostgreSQL não está rodando'))) {
            actions.push('Iniciar PostgreSQL: sudo systemctl start postgresql');
        }
        if (this.errors.some(e => e.includes('Redis não está rodando'))) {
            actions.push('Iniciar Redis: sudo systemctl start redis-server');
        }
        if (this.errors.some(e => e.includes('Node.js'))) {
            actions.push('Atualizar Node.js para versão 18 ou superior');
        }
        if (this.errors.some(e => e.includes('.env'))) {
            actions.push('Criar arquivo .env: cp .env.example .env');
        }
        if (this.errors.some(e => e.includes('node_modules'))) {
            actions.push('Instalar dependências: npm install');
        }
        
        // Baseado nos avisos
        if (this.warnings.some(w => w.includes('DATABASE_URL'))) {
            actions.push('Configurar DATABASE_URL no arquivo .env');
        }
        if (this.warnings.some(w => w.includes('API não está rodando'))) {
            actions.push('Iniciar API: npm run dev');
        }
        
        if (actions.length > 0) {
            actions.forEach((action, i) => {
                console.log(`  ${i + 1}. ${action}`);
            });
        } else {
            console.log('  Nenhuma ação necessária!');
        }
        console.log();
    }

    saveReport() {
        const reportPath = 'health-check-report.json';
        const report = {
            timestamp: new Date().toISOString(),
            results: this.results,
            errors: this.errors,
            warnings: this.warnings
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`${colors.green}📄 Relatório completo salvo em: ${reportPath}${colors.reset}\n`);
    }
}

// ========================================
// troubleshoot.js - Script de Troubleshooting
// ========================================

class Troubleshooter {
    constructor() {
        this.fixes = {
            database: [
                {
                    error: 'ECONNREFUSED',
                    description: 'PostgreSQL não está aceitando conexões',
                    solutions: [
                        'Verificar se PostgreSQL está rodando: sudo systemctl status postgresql',
                        'Iniciar PostgreSQL: sudo systemctl start postgresql',
                        'Verificar pg_hba.conf: sudo nano /etc/postgresql/*/main/pg_hba.conf',
                        'Alterar método de autenticação de "peer" para "md5"',
                        'Reiniciar PostgreSQL: sudo systemctl restart postgresql'
                    ]
                },
                {
                    error: 'password authentication failed',
                    description: 'Senha incorreta para o usuário do banco',
                    solutions: [
                        'Verificar credenciais no arquivo .env',
                        'Resetar senha do usuário PostgreSQL:',
                        '  sudo -u postgres psql',
                        '  ALTER USER whatsapp_user WITH PASSWORD \'nova_senha\';',
                        'Atualizar DATABASE_URL no .env'
                    ]
                },
                {
                    error: 'database does not exist',
                    description: 'Banco de dados não existe',
                    solutions: [
                        'Criar banco de dados:',
                        '  sudo -u postgres createdb whatsapp_automation',
                        'Ou via psql:',
                        '  sudo -u postgres psql',
                        '  CREATE DATABASE whatsapp_automation;'
                    ]
                },
                {
                    error: 'P1001',
                    description: 'Prisma não consegue conectar ao banco',
                    solutions: [
                        'Verificar DATABASE_URL no .env',
                        'Formato correto: postgresql://usuario:senha@localhost:5432/banco',
                        'Testar conexão: psql -h localhost -U usuario -d banco',
                        'Regenerar Prisma Client: npx prisma generate'
                    ]
                }
            ],
            redis: [
                {
                    error: 'ECONNREFUSED 6379',
                    description: 'Redis não está rodando',
                    solutions: [
                        'Verificar status: sudo systemctl status redis-server',
                        'Iniciar Redis: sudo systemctl start redis-server',
                        'Se não existir redis-server, tentar: sudo systemctl start redis',
                        'Verificar porta: redis-cli ping'
                    ]
                },
                {
                    error: 'NOAUTH Authentication required',
                    description: 'Redis requer senha',
                    solutions: [
                        'Adicionar senha no .env: REDIS_PASSWORD=sua_senha',
                        'Ou remover senha do Redis:',
                        '  sudo nano /etc/redis/redis.conf',
                        '  Comentar linha: # requirepass senha',
                        'Reiniciar Redis: sudo systemctl restart redis-server'
                    ]
                }
            ],
            node: [
                {
                    error: 'Cannot find module',
                    description: 'Módulo não encontrado',
                    solutions: [
                        'Instalar dependências: npm install',
                        'Limpar cache: npm cache clean --force',
                        'Remover node_modules: rm -rf node_modules package-lock.json',
                        'Reinstalar: npm install'
                    ]
                },
                {
                    error: 'EADDRINUSE',
                    description: 'Porta já está em uso',
                    solutions: [
                        'Encontrar processo: sudo lsof -i :3000',
                        'Matar processo: sudo kill -9 <PID>',
                        'Ou mudar porta no .env: PORT=3001'
                    ]
                }
            ],
            prisma: [
                {
                    error: 'migration failed',
                    description: 'Migration do Prisma falhou',
                    solutions: [
                        'Resetar banco (CUIDADO - apaga dados):',
                        '  npx prisma migrate reset --force',
                        'Criar migrations novamente:',
                        '  npx prisma migrate dev --name init',
                        'Se o banco já existe:',
                        '  npx prisma db pull',
                        '  npx prisma generate'
                    ]
                }
            ]
        };
    }

    async diagnose() {
        console.log(`${colors.magenta}╔══════════════════════════════════════════════════════════╗`);
        console.log(`║            WhatsApp Backend - Troubleshooter             ║`);
        console.log(`╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);

        console.log('Qual problema você está enfrentando?\n');
        console.log('1) Erro de conexão com banco de dados');
        console.log('2) Erro de conexão com Redis');
        console.log('3) Erro ao instalar dependências');
        console.log('4) Erro ao executar migrations');
        console.log('5) API não inicia');
        console.log('6) Verificar logs de erro');
        console.log('7) Reset completo (desenvolvimento)');
        console.log('8) Sair\n');

        // Simular seleção para exemplo
        this.showCommonFixes();
    }

    showCommonFixes() {
        console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
        console.log(`${colors.bright}               SOLUÇÕES MAIS COMUNS${colors.reset}`);
        console.log(`${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);

        // Database fixes
        console.log(`${colors.yellow}🗄️  Problemas com Banco de Dados:${colors.reset}`);
        this.fixes.database.forEach(fix => {
            console.log(`\n  ${colors.bright}${fix.description}${colors.reset}`);
            fix.solutions.forEach(solution => {
                console.log(`    • ${solution}`);
            });
        });

        // Redis fixes
        console.log(`\n${colors.yellow}🔴 Problemas com Redis:${colors.reset}`);
        this.fixes.redis.forEach(fix => {
            console.log(`\n  ${colors.bright}${fix.description}${colors.reset}`);
            fix.solutions.forEach(solution => {
                console.log(`    • ${solution}`);
            });
        });

        // Node fixes
        console.log(`\n${colors.yellow}📦 Problemas com Node/NPM:${colors.reset}`);
        this.fixes.node.forEach(fix => {
            console.log(`\n  ${colors.bright}${fix.description}${colors.reset}`);
            fix.solutions.forEach(solution => {
                console.log(`    • ${solution}`);
            });
        });

        console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}\n`);
    }
}

// Executar verificação ou troubleshooting
if (process.argv[2] === 'troubleshoot') {
    new Troubleshooter().diagnose();
} else {
    new SystemHealthCheck().run().catch(console.error);
}