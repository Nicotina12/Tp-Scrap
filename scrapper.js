const puppeteer = require('puppeteer');
const XLSX = require('xlsx');

async function obtenerDatosLenguajes() {
    const navegador = await puppeteer.launch({ headless: true }); 
    const pagina = await navegador.newPage();

    try {
        async function extraerDatos(url, selectorTabla, columnas, posiciones) {
            await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await pagina.waitForSelector(selectorTabla);

            return await pagina.evaluate((selectorTabla, columnas, posiciones) => {
                const filas = Array.from(document.querySelectorAll(selectorTabla)).slice(1);
                return filas.map(fila => {
                    const celdas = fila.querySelectorAll('td');
                    const resultado = {};
                    columnas.forEach(columna => {
                        const index = posiciones[columna]; 
                        resultado[columna] = celdas[index]?.textContent.trim() || 'Dato no disponible';
                    });

                    return resultado;
                }).filter(item => item); 
            }, selectorTabla, columnas, posiciones);
        }

        //Posiciones de las celdas
        const posiciones = {
            'TIOBE': {
                posicion: 0,  
                lenguaje: 4,  
                porcentaje: 5 
            },
            'Tecsify': {
                posicion: 0,  
                lenguaje: 4,  
                porcentaje: 5 
            },
            'StaticTimes': {
                posicion: 0,   
                lenguaje: 2,  
                porcentaje: 3, 
                tendencia: 4  
            }
        };

        // Scraping 
        const datosTIOBE = await extraerDatos(
            'https://www.tiobe.com/tiobe-index/',
            'table#top20 tr',
            ['posicion', 'lenguaje', 'porcentaje'],
            posiciones['TIOBE']
        );

        const datosTecsify = await extraerDatos(
            'https://tecsify.com/blog/top-lenguajes-2024/',
            'article table tr',
            ['posicion', 'lenguaje', 'porcentaje'],
            posiciones['Tecsify']
        );

        const datosStaticTimes = await extraerDatos(
            'https://statisticstimes.com/tech/top-computer-languages.php',
            '#table_id1 tbody tr',
            ['posicion', 'lenguaje', 'porcentaje', 'tendencia'],
            posiciones['StaticTimes']
        );

        // Crear y guardar en Excel
        const libroExcel = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(libroExcel, XLSX.utils.json_to_sheet(datosTIOBE), 'TIOBE');
        XLSX.utils.book_append_sheet(libroExcel, XLSX.utils.json_to_sheet(datosTecsify), 'Tecsify');
        XLSX.utils.book_append_sheet(libroExcel, XLSX.utils.json_to_sheet(datosStaticTimes), 'StaticTimes');

        XLSX.writeFile(libroExcel, 'tabla_lenguajes_programacion.xlsx');
        console.log('Archivo Excel guardado correctamente.');

    } catch (error) {
        console.error('Error al realizar scraping:', error);
    } finally {
        await navegador.close();
    }
}

obtenerDatosLenguajes();