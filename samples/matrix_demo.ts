import * as Debug from 'debug';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

import { PID } from 'token-flow';

import { attributesFromYamlString, AttributeInfo, AttributeItem, itemsFromAttributes, Matrix } from '../src/attributes';
import { Catalog, ParentItemDescription, ItemDescription } from '../src/catalog';

function* combinationsHelper(matrix: Matrix, index: number, map: Map<PID,PID>): IterableIterator<Map<PID, PID>> {
    const dimension = matrix.dimensions[index];
    for (const attribute of dimension.attributes) {
        map.set(dimension.id, attribute.pid);
        if (index === matrix.dimensions.length - 1) {
            yield map;
        }
        else {
            yield* combinationsHelper(matrix, index + 1, map);
        }
    }
}

function* combinations(matrix: Matrix): IterableIterator<Map<PID, PID>> {
    yield* combinationsHelper(matrix, 0, new Map<PID,PID>());
}

function getName(
    combos: Map<PID, PID>,
    attributeFromPID: Map<PID, AttributeItem>,
    name: string
): string {
    const fields: string[] = [];
    for (const pid of combos.values()) {
        const attribute = attributeFromPID.get(pid);
        if (attribute === undefined) {
            const message = `unknown attribute pid ${pid}`;
            throw TypeError(message);
        }
        if (!attribute.hidden) {
            fields.push(attribute.name);
        }
    }

    fields.push(name);

    return fields.join(' ');
}


function explode(
    attributeFromPID: Map<PID, AttributeItem>,
    info: AttributeInfo,
    items: IterableIterator<ItemDescription>,
    parentItems: IterableIterator<ParentItemDescription>,
) {
    const outputs: ItemDescription[] = [];

    for (const generic of parentItems) {
        //outputs.push(generic);

        const matrixId = generic.matrix;
        if (matrixId === undefined) {
            const message = `unknown matrix id ${matrixId}`;
            throw TypeError(message);
        }
        const matrix = info.getMatrix(matrixId);
        if (matrix === undefined) {
            const message = `unknown matrix id ${matrixId}.`;
            throw TypeError(message);
        }

        let sku = generic.pid + 1;
        const base = generic.name;
        for (const c of combinations(matrix)) {
            const name = getName(c, attributeFromPID, base);
            const itemKey = matrix.getKey(generic.pid, c, info);
            const itemPrice = items.next().value.price;


            outputs.push({
                pid: generic.pid,
                name,
                aliases: [],
                price: itemPrice,
                key: itemKey,
                sku,
                composition: {
                    defaults: [],
                    choices: [],
                    substitutions: [],
                    options: []
                }
            });

            console.log(`${sku}: ${name} (key = ${itemKey})`);
            sku++;
        }
    }
    return outputs;
}

function go(
  attributesFile: string,
  specificItems: IterableIterator<ItemDescription>,
  genericItems: IterableIterator<ParentItemDescription>,

) {
    const attributes =
        attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    
    const attributeFromPID = new Map<PID, AttributeItem>();
    for (const attribute of itemsFromAttributes(attributes)) {
        if (attributeFromPID.has(attribute.pid)) {
            const message = `duplicate attribute id ${attribute.pid}`;
            throw TypeError(message);
        }
        attributeFromPID.set(attribute.pid, attribute);
    }

    const catalogItems = { 
        genericItems: [],
        specificItems: [],
    };

    const catalog = new Catalog(catalogItems);

    const info = AttributeInfo.factory(catalog, attributes);

    const outputs = explode(attributeFromPID, info, specificItems, genericItems);

    const yamlText = yaml.dump(outputs);
    console.log(yamlText);
}

const coffeeMatrix = 1;
const genericLatte: ParentItemDescription = {
    pid: 9000,
    name: 'latte',
    aliases: ['latte'],
    matrix: coffeeMatrix,
    composition: {
        defaults: [],
        choices: [],
        substitutions: [],
        options: []
    }
};
const latte: ItemDescription = {
    pid: 9000,
    name: 'latte',
    aliases: ['latte'],
    price: 1.99,
    key: String(coffeeMatrix),
    sku: 90001,
    composition: {
        defaults: [],
        choices: [],
        substitutions: [],
        options: []
    }
};

const coneMatrix = 2;
const genericCone: ParentItemDescription = {
    pid: 8000,
    name: 'cone',
    aliases: ['cone', 'ice cream [cone]'],
    matrix: coneMatrix,
    composition: {
        defaults: [],
        choices: [],
        substitutions: [],
        options: []
    }
};
const cone: ItemDescription = {
    pid: 8000,
    name: 'cone',
    aliases: ['cone', 'ice cream [cone]'],
    price: 1.99,
    key: String(coneMatrix),
    sku: 80001,
    composition: {
        defaults: [],
        choices: [],
        substitutions: [],
        options: []
    }
};

go(
    path.join(__dirname, './data/restaurant-en/attributes.yaml'),
    [cone, latte].values(),
    [genericCone, genericLatte].values(),
);
