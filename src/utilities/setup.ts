import * as fs from 'fs';
import * as yaml from 'js-yaml';

import {
    attributesFromYamlString,
    AttributeInfo,
    CartOps,
    Catalog,
    CatalogItems,
    ConvertDollarsToPennies,
    Parser,
    ParentItemDescription,
    ItemDescription,
    Unified,
    validateCatalogItems
} from '..';
import { Attributes } from '../attributes';

export interface World {
    attributes: Attributes;
    attributeInfo: AttributeInfo;
    catalog: Catalog;
    ops: CartOps;
    parser: Parser;
    unified: Unified;
}


export function setup(
    generalCatalogFile: string,
    catalogFile: string,
    intentsFile: string,
    attributesFile: string,
    quantifiersFile: string,
    unitsFile: string,
    stopwordsFile: string,
    debugMode: boolean,
    itemFolding = true
): World {
    const genericItems = yaml.safeLoad(fs.readFileSync(generalCatalogFile, 'utf8')) as {
      items: ParentItemDescription[];
    };

    const specificItems = yaml.safeLoad(fs.readFileSync(catalogFile, 'utf8')) as {
        items: ItemDescription[];
    };
    const catalogItems: CatalogItems = {
        genericItems: genericItems.items,
        specificItems: specificItems.items,
    };

    validateCatalogItems(catalogItems);
    ConvertDollarsToPennies(catalogItems);
    const catalog = new Catalog(catalogItems);

    const attributes = attributesFromYamlString(fs.readFileSync(attributesFile, 'utf8'));
    const attributeInfo = AttributeInfo.factory(catalog, attributes);

    const ops = new CartOps(catalog, true, itemFolding);

    const unified = 
        new Unified(
            generalCatalogFile,
            catalogFile,
            intentsFile,
            attributesFile,
            quantifiersFile,
            unitsFile,
            stopwordsFile,
            debugMode);

    const parser = new Parser(catalog, attributeInfo, unified, debugMode);

    return {
        attributes,
        attributeInfo,
        catalog,
        ops,
        parser,
        unified
    };
}
