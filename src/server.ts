import fs from 'fs';
import http from 'http';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export async function startServer(templatePath: string, port: number = 8080): Promise<void> {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            let filePath = '';
            
            if (req.url === '/' || req.url === '/template/korean-practice-template.html') {
                filePath = templatePath;
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
            } else if (req.url === '/output/korean_vocabulary.csv' || req.url === '/korean_vocabulary.csv') {
                filePath = path.resolve('output/korean_vocabulary.csv');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
            } else if (req.url === '/output/korean_words.csv' || req.url === '/korean_words.csv') {
                filePath = path.resolve('output/korean_words.csv');
                res.setHeader('Content-Type', 'text/csv; charset=utf-8');
                res.setHeader('Access-Control-Allow-Origin', '*');
            } else {
                res.writeHead(404);
                res.end('Not found');
                return;
            }
            
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                res.writeHead(200);
                res.end(content);
            } catch (error) {
                res.writeHead(500);
                res.end('Error reading file');
            }
        });
        
        server.listen(port, () => {
            const url = `http://localhost:${port}/template/korean-practice-template.html`;
            console.log(`Server running at http://localhost:${port}`);
            console.log('Opening practice template in browser...');
            
            try {
                const platform = process.platform;
                let command: string;
                
                if (platform === 'darwin') {
                    command = `open "${url}"`;
                } else if (platform === 'win32') {
                    command = `start "" "${url}"`;
                } else {
                    command = `xdg-open "${url}"`;
                }
                
                execAsync(command);
                console.log('Template opened in browser.');
                console.log(`\nServer will keep running. Press Ctrl+C to stop.`);
                resolve();
            } catch (error) {
                console.log(`Could not open browser automatically. Please open: ${url}`);
                resolve();
            }
        });
        
        server.on('error', (error) => {
            reject(error);
        });
        
        // Handle shutdown
        process.on('SIGINT', () => {
            console.log('\nShutting down server...');
            server.close();
            process.exit(0);
        });
    });
}

