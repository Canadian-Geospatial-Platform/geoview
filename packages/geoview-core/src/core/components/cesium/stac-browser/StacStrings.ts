function isEnglish(): boolean {
  if (localStorage.getItem('userLanguage') === 'en' || localStorage.getItem('userLanguage') == null) {
    return true;
  }
  return false;
}

export function i18nSearch(): string {
  return isEnglish() ? 'Search' : 'Rechercher';
}

export function i18nCollections(): string {
  return isEnglish() ? 'Collections' : 'Collections';
}

export function i18nBack(): string {
  return isEnglish() ? 'Back' : 'Retour';
}

export function i18nKeywords(): string {
  return isEnglish() ? 'Keywords: ' : 'Mots-clés: ';
}

export function i18nGettingStacCatalog(): string {
  return isEnglish() ? 'Getting STAC Catalog' : 'Obtenir le catalogue STAC';
}

export function i18nLicense(): string {
  return isEnglish() ? 'License: ' : 'Licence: ';
}

export function i18nSelectAsset(): string {
  return isEnglish() ? 'Select Asset' : 'Sélectionner un actif';
}

export function i18nAddToMap(): string {
  return isEnglish() ? 'Add To Map' : 'Ajouter à la carte';
}

export function i18nSelectCollections(): string {
  return isEnglish() ? 'Select Collections. (Leave blank for all)' : 'Sélectionner des collections. (Laisser vide pour tous)';
}

export function i18nSelectLimit(): string {
  return isEnglish() ? 'Select Limit' : 'Sélectionner la limite';
}

export function i18nAddItemIds(): string {
  return isEnglish() ? 'Item IDs (comma separated)' : "ID d'élément (séparés par des virgules)";
}

export function i18nSearching(): string {
  return isEnglish() ? 'Searching' : 'Recherche';
}

export function i18nErrorSearchingStac(): string {
  return isEnglish() ? 'Error Searching STAC' : 'Erreur lors de la recherche de STAC';
}

export function i18nClear(): string {
  return isEnglish() ? 'Clear' : 'Clair';
}

export function i18nPreviousPage(): string {
  return isEnglish() ? 'Previous Page' : 'Page précédente';
}

export function i18nNextPage(): string {
  return isEnglish() ? 'Next Page' : 'Page suivante';
}

export function i18nResultsReturned(): string {
  return isEnglish() ? 'Returned: ' : 'De retour: ';
}

export function i18nResultsLimit(): string {
  return isEnglish() ? 'Limit: ' : 'Limite: ';
}

export function i18nResultsMatched(): string {
  return isEnglish() ? 'Matched: ' : 'Correspondance: ';
}

export function i18nNotListed(): string {
  return isEnglish() ? 'Not Listed' : 'Non répertorié';
}

export function i18nThumbnail(): string {
  return isEnglish() ? 'Thumbnail' : 'Vignette';
}

export function i18nNoThumbnail(): string {
  return isEnglish() ? 'No Thumbnail' : 'Pas de vignette';
}

export function i18nId(): string {
  return isEnglish() ? 'ID: ' : 'ID: ';
}

export function i18nBoundingBox(): string {
  return isEnglish() ? 'Bounding Box ' : 'Cadre de délimitation ';
}

export function i18nDateTime(): string {
  return isEnglish() ? 'Date/Time: ' : 'Date/Heure: ';
}

export function i18nCreationDate(): string {
  return isEnglish() ? 'Creation Date: ' : 'Date de création: ';
}

export function i18nIntersects(): string {
  return isEnglish() ? 'Intersects...' : 'Intersecte...';
}

export function i18nNone(): string {
  return isEnglish() ? 'None' : 'Aucun';
}

export function i18nPoint(): string {
  return isEnglish() ? 'Point' : 'Pointer';
}

export function i18nPolygon(): string {
  return isEnglish() ? 'Polygon' : 'Polygone';
}

export function i18nSelectGeometryTypeAbove(): string {
  return isEnglish() ? 'Select a geometry type above.' : 'Sélectionnez un type de géométrie ci-dessus.';
}

export function i18nLatitude(): string {
  return isEnglish() ? 'Latitude: ' : 'Latitude: ';
}

export function i18nLongitude(): string {
  return isEnglish() ? 'Longitude: ' : 'Longitude: ';
}

export function i18nAddVertex(): string {
  return isEnglish() ? 'Add Vertex' : 'Ajouter un dessus';
}

export function i18nCurrentIntersects(): string {
  return isEnglish() ? 'Current Intersects: ' : 'Intersections actuelles: ';
}

export function i18nCustom(): string {
  return isEnglish() ? 'Custom' : 'Personnalisable';
}

export function i18nCustomGeoJsonString(): string {
  return isEnglish() ? 'Custom GeoJson Expression' : 'Expression Geojson personnalisée';
}

export function i18nSave(): string {
  return isEnglish() ? 'Save' : 'Sauver';
}

export function i18nCancel(): string {
  return isEnglish() ? 'Cancel' : 'Annuler';
}

export function i18nBoundingBoxPlaceholder(): string {
  return isEnglish() ? 'West, South, East, North' : 'Ouest, Sud, Est, Nord';
}

export function i18nFilters(): string {
  return isEnglish() ? 'Filters:' : 'Filtres:';
}

export function i18nLimitResults(): string {
  return isEnglish() ? 'Limit Results:' : 'Limiter les résultats:';
}

export function i18nItemIds(): string {
  return isEnglish() ? 'Item IDs:' : "ID d'article:";
}

export function i18nIntersectsLabel(): string {
  return isEnglish() ? 'Intersects:' : 'Intersecte:';
}

export function i18nStartLabel(): string {
  return isEnglish() ? 'Start:' : 'Commencer:';
}

export function i18nEndLabel(): string {
  return isEnglish() ? 'End:' : 'Fin:';
}

export function i18nNoAssetSelected(): string {
  return isEnglish() ? 'No asset selected.' : 'Aucun actif sélectionné.';
}

export function i18nAssetHasInvalidFormat(): string {
  return isEnglish() ? 'Selected asset is of an unsupported format.' : "L'élément sélectionné est d'un format non pris en charge.";
}

export function i18nErrorLoadingStac(): string {
  return isEnglish() ? 'Error: Could not load STAC.' : 'Erreur : impossible de charger STAC.';
}
