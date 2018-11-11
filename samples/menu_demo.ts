import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as path from 'path';

import { Catalog, CatalogItems, validateCatalogItems, ConvertDollarsToPennies } from '../src';

function go(infile: string) {
    const catalogItems = yaml.safeLoad(fs.readFileSync(infile, 'utf8')) as CatalogItems;
    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);

    for (const [pid, item] of catalog.map) {
        if (item.standalone) {
            console.log(`${pid} ${item.name}`);
            if (item.composition.defaults.length > 0) {
                const defaults = item.composition.defaults.map( (x) => catalog.get(x.pid).name );
                console.log(`  Ingredients: ${defaults.join(', ')}`);
            }
            if (item.composition.options.length > 0) {
                const options = item.composition.options.map( (x) => catalog.get(x.pid).name );
                console.log(`  Options: ${options.join(', ')}`);
            }
            if (item.composition.choices.length > 0) {
                const choices = item.composition.choices.map( (x) => x.className );
                console.log(`  Choices: ${choices.join(', ')}`);
            }
            console.log();
        }
    }
}

go('./samples/data/restaurant-en/menu2.yaml');

