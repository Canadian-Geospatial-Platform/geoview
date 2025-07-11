=1!loadingStatus=
# Interaction avec la carte et état de chargement
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Ces indicateurs visuels et comportements de navigation contribuent à offrir une expérience fluide et intuitive avec la carte.

### Chargement initial
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Lors de l’initialisation du visualiseur de carte, un indicateur de chargement (spinner) s’affiche au-dessus de la carte. Cela signifie que les composants minimum requis sont en cours de chargement. Une fois ceux-ci correctement initialisés, le spinner disparaît pour révéler la carte.

Pendant le chargement initial des couches cartographiques, une barre de progression est visible au bas de la carte. Durant cette phase, certaines fonctionnalités — comme l’exportation de la carte — peuvent ne pas fonctionner comme prévu tant que toutes les couches ne sont pas entièrement chargées. Il est donc recommandé d’éviter les actions intensives jusqu’à la fin du chargement.

Dans le panneau **Légende** ou **Couches**, chaque couche affiche une icône de chargement (spinner) à gauche (à la place de l’icône de couche habituelle) tant qu’elle est en cours de traitement. Une fois la couche rendue correctement pour la première fois, le spinner est remplacé par l’icône correspondante.

### Rechargement des couches 
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Chaque fois que la carte est **déplacée** ou **zoomée**, certaines couches peuvent repasser en état de chargement. Lorsque cela se produit :
- Une barre de progression apparaît au bas de chaque encadré de couche concernée, indiquant une activité, peu importe l’onglet actif.
- Une barre de progression supplémentaire s’affiche également au bas de la carte, juste au-dessus de la barre d’information, tant qu’au moins une couche est encore en cours de chargement.

### Notifications aux utilisateurs et information sur l'état de la carte
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>
À tout moment, le visualiseur informe l’utilisateur de l’activité en cours en :
- Affichant un message au bas de la carte, et/ou
- Ajoutant une notification accessible depuis le panneau des notifications dans la barre latérale. Lorsqu'une nouvelle notification est ajoutée, un compteur rouge s’incrémente pour indiquer une mise à jour.

### Changer le focus entre la carte et le pied de page
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Si votre carte comprend une barre de pied de page, vous pouvez alterner le focus entre la carte et ce pied de page :
- Cliquer sur la barre noire d’information de la carte recentre l'affichage sur la carte.
- Cliquer sur la barre de pied de page fait apparaître le contenu associé.

### Amener le focus sur la carte
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Pour amener le focus sur la carte:
- Cliquer la  barre latérale recentre l'affichage sur la carte.

=1!navigationControls=
# Commandes de navigation
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Les commandes de navigation permettent d'ajuster l'étendue de la visualisation, la projection ou la carte de base.

Selon la configuration de la visionneuse, le coin inférieur droit de la carte contient les commandes de navigation suivantes :

| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/navigation/fullscreen.svg" width="30"/> | Plein écran | Permet de voir la carte sur toute la page en passant de la taille originale au plein écran. |
| <img src="{{assetsURL}}/img/guide/navigation/plus.svg" width="30"/> | Zoom avant | Permet de faire un zoom avant d’un niveau à la fois pour voir le contenu plus en détail; fonctionne aussi avec la touche d’addition du clavier (+). |
| <img src="{{assetsURL}}/img/guide/navigation/minus.svg" width="30"/> | Zoom arrière | Permet de faire un zoom arrière d’un niveau à la fois pour voir le contenu moins en détail; fonctionne aussi avec la touche de soustraction du clavier (-). |
| <img src="{{assetsURL}}/img/guide/navigation/geolocation.svg" width="30"/> | Géolocalisation | Permet de zoomer et de déplacer la carte sur votre position géographique. |
| <img src="{{assetsURL}}/img/guide/navigation/home.svg" width="30"/> | Vue initiale | Permet de zoomer et de déplacer la carte pour retourner à la vue initiale. |
| <img src="{{assetsURL}}/img/guide/navigation/basemapSelect.svg" width="30"/> | Changer la carte de base | Permet de changer la carte de base. |
| <img src="{{assetsURL}}/img/guide/navigation/projection.svg" width="30"/> | Changer la projection | Permet de changer la projection de la carte entre Web Mercator et LCC. |

Vous pouvez aussi déplacer la carte avec les touches fléchées vers la gauche, la droite, le haut et le bas, ou en cliquant sur la carte et en la faisant glisser. Lorsque le pointeur est sur la carte, la molette de la souris permet de faire un zoom avant et arrière.

Appuyez sur la touche **Maj.** tout en cliquant et en déplaçant la souris pour définir une zone sur la carte. Relâchez la souris; le zoom se fait sur la zone sélectionnée.

Appuyez sur les touches **Maj.** et **Alt.** tout en cliquant et en déplaçant la souris pour faire tourner la carte. Pour réinitialiser l’orientation de la carte, cliquez sur la flèche **Réinitialiser** la rotation de la carte" à droite de la barre d’information au bas de la carte.

_N.B. : La carte doit être focalisée pour que les combinaisons de touches fonctionnent._

=2!overviewMap=
### Carte d’aperçu
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Selon la configuration de la visionneuse, la carte peut fournir une carte d'aperçu, une représentation générique de la carte principale à une taille réduite. Elle est située dans le coin supérieur droit de la carte.

<img src="{{assetsURL}}/img/guide/navigation/overview.png" style="width: 90%;"/>

Cliquez sur l’encadré dans la carte d’aperçu et déplacez-le pour modifier la vue sur la carte principale. Cliquez sur l’icône de basculement dans le coin supérieur droit pour afficher ou masquer la carte d’aperçu.

=2!keyboardNavigation=
### Navigation avec le clavier
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Les personnes qui ne peuvent pas utiliser de souris peuvent choisir de naviguer avec le clavier. Utilisez la touche de **tabulation** pour atteindre les liens et les commandes sur la page. Appuyez sur **Maj.** et la touche de **tabulation** pour revenir à l’élément précédent. Utilisez la touche **Entrée** ou la **barre d’espace** pour activer les liens et les commandes.

Si vous utilisez la touche de **tabulation** pour naviguer dans la carte, la fenêtre contextuelle **Navigation clavier** s’affichera. Sélectionnez le bouton **Activer** et appuyez sur **Entrée** pour utiliser la navigation avec le clavier.

Lorsque la carte est focalisée, un pointeur en croix s’affiche en son centre :

<img src="{{assetsURL}}/img/guide/navigation/crosshair.svg" style="width: 90%; height: 100px;"/>

Utilisez les touches **fléchées** pour déplacer la carte et les touches **+** et **-** pour faire un zoom avant ou arrière. Appuyez sur **Entrée** pour sélectionner un élément sous le pointeur en croix et en voir les données dans le panneau **Détails**.

Pour les éléments pris en charge, l’information s’affiche lorsque le pointeur en croix les survole.

Appuyez sur **Ctrl** et **Q** pour quitter la navigation avec le clavier.

_N.B. : La carte doit être focalisée pour que les combinaisons de touches fonctionnent. La carte est focalisée lorsque le pointeur en croix s’affiche._

**Accessibilité**

La carte n’est pas pleinement conforme au niveau AA des Règles pour l’accessibilité des contenus Web (WCAG) 2.0.

=1!mapInformationBar=
# Barre d’information sur la carte
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Cliquez sur le chevron vers le haut ![]({{assetsURL}}/img/guide/navigation/chevron_up.svg) à gauche pour développer ou réduire la barre.

<img src="{{assetsURL}}/img/guide/navigation/map_info.png" style="width: 90%;"/>

Les détails et fonctionnalités de navigation suivants sont accessibles dans la barre d'information sur la carte (il est nécessaire de développer la barre pour afficher toutes les options) :

| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/navigation/attribute.svg" width="30"/> | Attributs | Droits d’auteur et autres attributs de la carte. |
| | Coordonnées géographiques| Cliquez sur les coordonnées pour passer d’un format de coordonnées à l’autre : degrés, minutes et secondes (DMS), degrés décimaux ou coordonnées projetées. |
| | Échelle de la carte | Cliquez sur l’échelle de la carte pour basculer entre l’échelle et la résolution. |
| <img src="{{assetsURL}}/img/guide/navigation/up_arrow.svg" width="30"/> | Réinitialiser la rotation de la carte | Cliquez sur cette flèche pour rétablir l’orientation initiale de la carte. _N.B. : L’option Nord fixe doit être désactivée._ |
| | Nord fixe | Option qui s’active et se désactive. Activez-la pour garder la carte orientée le nord au haut. Accessible seulement sur certaines projections (p. ex. LCC). _N.B. : Il n’est pas possible de réinitialiser la rotation de la carte lorsque l’option **Nord fixe** est activée._ |

=1!sidebar=
# Barre latérale
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

La barre latérale, située sur le côté gauche de la carte, permet d'accéder aux outils et fonctionnalités disponibles.

_Les outils affichés peuvent varier en fonction de la configuration de la carte._

_N.B. : Certains outils dans la barre latérale se trouvent aussi sous forme d’onglet dans le pied de page, comme **Légende**, **Couches**, **Données** et **Détails**. Lorsqu’ouverts à partir de la barre latérale, **Légende** et **Détails** s’affichent sur la carte dans un format « mobile » condensé (une seule colonne). Ouverts à partir du pied de page, ils s’affichent comme onglets au bas de la carte dans un format détaillé complet._

| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" width="30"/> | [Géolocalisation](#geolocatorSection) | Cliquez sur l’icône de géolocalisation; un champ de recherche s’affiche sur la carte. |
| <img src="{{assetsURL}}/img/guide/sidebar/legend.svg" width="30"/> | Légende | Légende des icônes de la carte (_voir la section sur le pied de page pour en savoir plus_). |
| <img src="{{assetsURL}}/img/guide/footer/layers_30.svg" width="30"/> | Couches | Outil de gestion des couches (_voir la section sur le pied de page pour en savoir plus_). |
| <img src="{{assetsURL}}/img/guide/sidebar/details.svg" width="30"/> | Détails | Information détaillée des éléments sélectionnés (_voir la section sur le pied de page pour en savoir plus_). |
| <img src="{{assetsURL}}/img/guide/footer/data_table.svg" width="30"/> | Données | Table d'information détaillée des éléments (_voir la section sur le pied de page pour en savoir plus_). |
| <img src="{{assetsURL}}/img/guide/sidebar/guide.svg" width="30"/> | Guide | Guide d’aide. |
| <img src="{{assetsURL}}/img/guide/sidebar/export.svg" width="30"/> | [Télécharger](#exportSection) | Pour télécharger la carte en fichier PNG. |
| <img src="{{assetsURL}}/img/guide/sidebar/notifications.svg" width="30"/> | Notification | Présente les messages et les notifications pour la carte. |
| <img src="{{assetsURL}}/img/guide/sidebar/about.svg" width="30"/> | À propos de GéoView | Affiche les renseignements sur le visualiseur GéoView. |

=2!geolocator=
<a id="geolocatorSection">
### <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" width="30"/> Géolocalisation
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Permet de rechercher des endroits au Canada. Si vous cliquez sur l’icône de géolocalisation ![]({{assetsURL}}/img/guide/geosearch/geolocator.svg) dans la barre latérale, un champ de recherche s’affichera sur la carte :

<img src="{{assetsURL}}/img/guide/geosearch/searchbar_en.png" style="width: 90%;"/>

=3!supportedSearchTypes=

#### Types de recherches possibles

**Recherche par mot clé :** Entrez le mot clé de votre choix dans la barre de recherche par géolocalisation; vous obtenez une liste de résultats contenant le mot clé (au moins trois caractères).

- Pour chaque résultat, vous voyez le nom (mot clé en gras), la province et la catégorie (lac, ville, village, etc.) de l’emplacement.
- Si vous cliquez sur un résultat, ses coordonnées s’afficheront, et un zoom sera fait sur la carte à cet endroit.

**Recherche par RTA :** La **région de tri d’acheminement (RTA)** est un moyen de désigner une zone géographique avec les trois premiers caractères du code postal canadien. Tous les codes postaux ayant les trois mêmes premiers caractères constituent une **RTA**.

- Cliquez pour faire un zoom et centrer la carte sur la RTA.
- Exemple : Entrez **M3H**.

**Recherche par latitude et longitude :** Vous pouvez entrer la latitude et la longitude d’un point pour obtenir une liste de résultats à proximité sur la carte.

- Comme pour la recherche par RTA, le premier résultat sera l’emplacement correspondant aux coordonnées entrées; cliquez-le pour faire un zoom et centrer la carte sur ce point.
- Vous pouvez utiliser les espaces, les virgules, les points-virgules ou les barres verticales (|) pour séparer les coordonnées dans ce type de recherche.
- Exemple : Entrez **54.3733,-91.7417**.

**Recherche avec le SNRC :** Le **Système national de référence cartographique (SNRC)** fournit des cartes topographiques générales du pays présentant en détail la topographie, les lacs et les rivières, les forêts, les routes et les chemins de fer, etc.

- Le SNRC est organisé en trois grandes zones : le Sud (latitudes entre 40° N et 68° N), l’Arctique (latitudes entre 68° N et 80° N) et l’Extrême-Arctique (latitudes entre 80° N et 88° N).
- Un numéro de carte du SNRC se compose d’une chaîne de caractères : un nombre indiquant la feuille de carte, une lettre indiquant la zone sur la carte et un nombre indiquant l’échelle de la feuille de carte.
- Comme pour les types de recherches précédents, le premier résultat sera un emplacement pour le numéro de carte du SNRC; cliquez-le pour centrer la carte sur ce point.
- Exemple : Entrez **030M13**.

**Adresse municipale :** Si vous entrez directement une adresse municipale, vous devriez obtenir des résultats.

=3!geosearchFiltering=
#### Filtres de recherche géographique

Les résultats d’une recherche d’emplacement s’affichent dans un panneau sous le champ de recherche. Le panneau de résultats comprend deux menus déroulants permettant de filtrer les résultats par **province** et par **catégorie** (lac, village, rivière, etc.). Un bouton **Effacer les filtres** ![]({{assetsURL}}/img/guide/geosearch/clear.svg) se trouve à droite des menus.

=2!export=
<a id="exportSection">
### ![]({{assetsURL}}/img/guide/sidebar/export_30.svg) Télécharger
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

Vous pouvez télécharger une image de la carte avec ses couches visibles, la légende, le titre, la flèche du nord, la barre d’échelle et un horodatage.

Lorsque vous cliquez sur le bouton **Télécharger**, une fenêtre de dialogue s’ouvre contenant l’image de la carte et un champ où vous pouvez entrer un titre.

Cliquez sur le bouton **Télécharger** au bas de la fenêtre pour générer l’image finale de la carte.

=1!footerPanel=
# Pied de page
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>
<a id="footerSection"></a>
Le _pied de page_ se trouve sous la carte. Vous pouvez le développer en cliquant sur un des onglets de son menu. Pour le réduire, vous n’avez qu’à recliquer sur l’onglet actif.

**Pour passer de la carte à la section du pied de page, cliquez sur la barre d'information de la carte pour afficher la carte, ou cliquez sur la barre du pied de page pour afficher son contenu.**

_Les onglets affichés peuvent varier en fonction de la configuration de la carte._

Le menu du _pied de page_ se compose des onglets suivants :

- [Légende](#legendSection)
- [Couches](#layersSection)
- [Détails](#detailsSection)
- [Données](#dataTableSection)
- [Curseur temporel](#timeSliderSection)
- [Graphique](#chartSection)
- Guide

_N.B. : Certains onglets dans la barre latérale se trouvent aussi sous forme d’outils dans la barre latérale, comme **Légende**, **Couches**, **Données** et **Détails**. Lorsqu’ouverts à partir de la barre latérale, **Légende** et **Détails** s’affichent sur la carte dans un format « mobile » condensé (une seule colonne). Ouverts à partir du pied de page, ils s’affichent comme onglets au bas de la carte dans un format détaillé complet._

=2!legend=
<a id="legendSection"></a>
<h3><img src="{{assetsURL}}/img/guide/sidebar/legend.svg" width="30"> Légende <a href="#footerSection">Haut de page</a></h3>
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

L’onglet **Légende** présente les symboles des couches affichées sur la carte.

Chaque couche a ses symboles. Pour les couches à éléments simples, il n’y a qu’une seule icône ![]({{assetsURL}}/img/guide/footer/icon_single.png) à côté du nom de la couche.

Pour celles à éléments complexes (plusieurs symboles par couche), les icônes prennent la forme d’une pile ![]({{assetsURL}}/img/guide/footer/icon_multiple.png) (placez votre pointeur sur la pile pour voir les icônes).

Vous pouvez développer ou réduire la liste des symboles d’une couche sous son nom. Certaines couches ont parfois une légende graphique; le cas échéant, elle sera dans le même format de liste déroulante.


| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/layers/scaleVisible.svg" width="30"/> | Zoom sur l'échelle visible | Zoom sur l'échelle visible de la couche, un déplacement de la carte peut être nécessaire pour localiser les éléments. _N.B. : Seulement disponible quand la couche est hors zoom_. |
| <img src="{{assetsURL}}/img/guide/footer/view_25.svg" width="30"/> | Basculer la visibilité | Basculer la visibilité de la couche. |
| <img src="{{assetsURL}}/img/guide/layers/highlight_60.svg" width="30"/> | Couche mise en évidence| Place la couche au premier plan, diminue l’opacité des autres couches et affiche le périmètre de la couche. |
| <img src="{{assetsURL}}/img/guide/layers/zoom_60.svg" width="30"/> | Zoom sur le périmètre de la couche| Déplace la carte et fait un zoom pour que le périmètre de la couche soit visible. |

=2!layers=
<a id="layersSection"></a>
### ![]({{assetsURL}}/img/guide/footer/layers_30.svg) Couches [Haut de page](#footerSection)
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

L’onglet **Couches** comprend les sous-menus suivants :

- Vue
- Ajouter
- Trier
- Retirer

=3!view=
#### ![]({{assetsURL}}/img/guide/footer/view_25.svg) Vue

_**N.B. : Cliquez sur une couche pour afficher ses information dans la section de droite.**_

**Information importante**  
Si l'icône de visibilité (œil) d'une couche est désactivée (grisée) ![]({{assetsURL}}/img/guide/footer/eye_disabled.png) et que l'icône Zoom sur l'échelle visible  <img src="{{assetsURL}}/img/guide/layers/scaleVisible.svg" /> est visible, cela signifie que la couche n'est pas visible au niveau de zoom actuel de la carte.

- En cliquant sur le bouton Zoom sur l'échelle visible, la carte sera ajustée au niveau de zoom approprié, ce qui rendra la couche visible.
- Cependant, après avoir effectué un zoom, il se peut que vous ne voyiez pas immédiatement les éléments s'il n'y a pas de données dans la zone de visualisation actuelle.
- Dans ce cas, vous devrez peut-être effectuer un déplacement de la carte pour localiser les éléments.

Le sous-menu **Vue** de l’onglet **Couches** se divise en deux sections. La section de gauche présente les couches affichées sur la carte. Si vous cliquez sur une couche, ses paramètres (options accessibles pour la couche) s’afficheront dans la section de droite.

**Icônes de couche**

Chaque couche a ses symboles. Pour les couches à éléments simples, il n’y a qu’une seule icône ![]({{assetsURL}}/img/guide/footer/icon_single.png) à côté du nom de la couche. Pour celles à éléments complexes (plusieurs symboles par couche), les icônes prennent la forme d’une pile (placez votre pointeur sur la pile pour voir les icônes ![]({{assetsURL}}/img/guide/footer/icon_multiple.png)).

**Groupe de couches**

L’icône de groupe ![]({{assetsURL}}/img/guide/layers/group.svg) indique un groupe de couches. Cliquez sur le groupe pour voir la liste des sous-couches. Les sous-couches peuvent elles aussi être des groupes de couches.

**Affichage des couches**

Cliquez sur l’icône d’œil à côté de chaque couche pour afficher ![]({{assetsURL}}/img/guide/footer/eye.png) ou masquer ![]({{assetsURL}}/img/guide/footer/eye_not_visible.png) la couche sur la carte.

Si une couche est toujours visible, l’icône d’affichage (œil) est désactivée (grisée) ![]({{assetsURL}}/img/guide/footer/eye_disabled.png).

**Types de couches pris en charge**

Les couches peuvent être en format de trame ou vectoriel. Voici les types de couches pris en charge :

| Couches en format de trame | Couches en format vectoriel |
|----------|----------|
| Dynamique ESRI | Entités ESRI |
| Imagerie ESRI | GeoJSON |
| Tuile XYZ | Couche d’entités OGC API |
| WMS | CSV |
| Image statique | WFS |
| Couche de tuiles vectorielles |

_N.B. : Si une couche ne se charge pas correctement, un message d’erreur s’affichera dans l’outil de *notification* de la barre latérale. Au lieu d’utiliser les actions standard pour les couches, vous pouvez soit recharger la couche (surtout utile s’il y a un problème temporaire de connexion réseau), soit la retirer. Si vous retirez la couche, elle sera retirée complètement du sélecteur de couches._

=3!layerSettings=
#### Paramètres des couches

Dans l’onglet **Vue**, si vous cliquez sur une couche dans la section de gauche, ses paramètres s’afficheront dans celle de droite.

_N.B. : Les paramètres accessibles dépendent de plusieurs facteurs, comme le type de couche et la configuration._

| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/layers/table_view_60.svg" width="30"/> | Table détaillée | Ouvre une vue simplifiée du tableau des données. |
| <img src="{{assetsURL}}/img/guide/layers/refresh_60.svg" width="30"/> | Réinitialiser la couche | Réinitialiser la couche dans sont état initial. |
| <img src="{{assetsURL}}/img/guide/layers/highlight_60.svg" width="30"/> | Couche mise en évidence | Place la couche au premier plan, diminue l’opacité des autres couches et affiche le périmètre de la couche. |
| <img src="{{assetsURL}}/img/guide/layers/zoom_60.svg" width="30"/> | Zoom sur la couche | Déplace la carte et fait un zoom pour que le périmètre de la couche soit visible. |
| <img src="{{assetsURL}}/img/guide/layers/opacity.png" width="80"/> | Opacité | Curseur permettant d’augmenter ou de diminuer l’opacité de la couche. |

**Classes de couches**

Si la couche possède des classes, elles seront indiquées dans ses paramètres. Cochez ou décochez la case ![]({{assetsURL}}/img/guide/layers/check.png) à côté de la classe pour afficher ou masquer celle-ci.

On voit le nombre de classes visibles sous le nom de la couche.

=3!add=
#### ![]({{assetsURL}}/img/guide/layers/add_25.svg) Ajouter

Vous pouvez ajouter des couches au visualiseur de cartes dans le sous-menu **Ajouter** de l’onglet **Couches**.

Marche à suivre :

- Pour ajouter un fichier, vous pouvez soit glisser le fichier dans l’assistant d’importation, soit cliquer sur le bouton **Choisir un fichier**, soit entrer l’URL du fichier.
- Pour ajouter un service, entrez l’URL du service dans le champ de texte.
- Cliquez sur le bouton **Continuer** pour passer à la prochaine étape.
- Vérifiez que le bon format de fichier ou de service est sélectionné dans le menu déroulant. S’il est erroné, vous recevrez un message d’erreur vous demandant de choisir un autre format.
- Cliquez sur le bouton **Continuer** pour passer à la prochaine étape. Le format de fichier (p. ex. CSV) devrait s’afficher.
- Selon le type d’ensemble de données ajouté, vous pourrez configurer différents paramètres à l’étape finale.
- Cliquez sur le bouton **Continuer** pour insérer la couche dans la carte.

Le visualiseur passe automatiquement à la fonction **Vue**.

=3!sort=
#### ![]({{assetsURL}}/img/guide/layers/sort_25.svg) Trier

Pour trier les couches, vous n’avez qu’à utiliser les flèches vers le haut et le bas dans l’encadré de chaque couche.

=3!remove=
#### ![]({{assetsURL}}/img/guide/layers/remove_25.svg) Retirer

Pour retirer une couche, cliquez sur l’icône de suppression ![]({{assetsURL}}/img/guide/layers/remove_25.svg) à droite de celle-ci dans le sous-menu **Retirer**.

=2!details=
<a id="detailsSection"></a>
### ![]({{assetsURL}}/img/guide/sidebar/details_30.svg) Détails [Haut de page](#footerSection)
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**N.B. : Il faut sélectionner un élément sur la carte pour que la couche devienne cliquable dans la liste, sans quoi elle sera désactivée (grisée).**_

L’onglet **Détails** se divise en deux sections. La section de gauche dresse la liste des couches accessibles, tandis que celle de droite affiche le détail des éléments pour chaque couche.

Cliquez sur une couche pour afficher ses éléments en détail.

Le nombre d’éléments pour la couche sélectionnée est indiqué en haut à gauche de la section détaillée.

Utilisez les flèches vers la droite et la gauche, en haut à droite de la section, pour passer d’un élément à l’autre de la couche sélectionnée.

L’icône de loupe ![]({{assetsURL}}/img/guide/datatable/zoom.svg) permet de faire un zoom sur l’élément sélectionné sur la carte.

Cochez la case ![]({{assetsURL}}/img/guide/layers/check.png) pour garder l’élément sélectionné sur la carte.

=2!dataTable=
<a id="dataTableSection"></a>
### ![]({{assetsURL}}/img/guide/footer/data_table.svg) Données [Haut de page](#footerSection)
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**N.B. : Cliquez sur une couche pour afficher ses données dans la section de droite.**_

**Informations importantes sur la navigation**
- Vous pouvez demander des données à partir d'une seule table à la fois. Pendant l'extraction des données, tous les boutons _couches_ sont désactivés.
- La couche sélectionnée sera en vert et un message de progression apparaîtra au bas de la section carte.
- Une fois la recherche de données terminée, tous les boutons _couches_ sont réactivés.
- Si vous passez à un autre onglet pendant le processus, vous devrez resélectionner la couche lorsque vous reviendrez à l'onglet _Données_ pour afficher les résultats.

L’onglet **Données** se divise en deux sections. La liste des couches se trouve à gauche, et les données des couches, à droite. Cliquez sur une couche pour en voir les données dans le tableau de droite.

**Commandes de l’onglet Données**

Les commandes de l’onglet **Données** se trouvent dans le coin supérieur droit du panneau des données de couche.

_N.B. : Selon différents facteurs, certaines options sont désactivées ou présélectionnées._

| Symbole | Nom | Description |
|----------|----------|----------|
| <img src="{{assetsURL}}/img/guide/datatable/filters_clear.svg" width="30"/> | Effacer les filters | Effacer tout les filtres de la table. |
| <img src="{{assetsURL}}/img/guide/datatable/filter_toggle.svg" width="30"/> | Afficher/masquer les filtres| Basculer entre l’affichage et le masquage des filtres. |
| <img src="{{assetsURL}}/img/guide/datatable/filter.png" width="30"/> | Interrupteur de filtres| Appliquer les filtres à la carte. |
| <img src="{{assetsURL}}/img/guide/datatable/column_show.svg" width="30"/> | Afficher/masquer les colonnes| Choisir les colonnes visibles et épingler des colonnes à gauche ou à droite du tableau. |
| <img src="{{assetsURL}}/img/guide/datatable/density.svg" width="30"/> | Densité | Modifier la hauteur des lignes du tableau de données. |
| <img src="{{assetsURL}}/img/guide/datatable/export.svg" width="30"/> | Télécharger | Télécharger le tableau en format CSV ou GeoJSON. Pourrait échouer sur un appareil mobile en raison des restrictions de téléchargement de fichiers. |

Les trois premières colonnes du tableau de données sont **Icône**, **Zoom** et **Détails**. Les autres colonnes varient selon la couche sélectionnée.

En plus de parcourir les données, vous pouvez :

- trier les données en cliquant sur l’icône de tri ![]({{assetsURL}}/img/guide/footer/swap_vert_FILL0_wght400_GRAD0_opsz24.svg) dans le titre de colonne;
- afficher sur la carte l’emplacement de l’élément associé à une ligne donnée en cliquant sur l’icône de zoom ![]({{assetsURL}}/img/guide/datatable/zoom.svg).

Cliquez sur l’icône d’actions ![]({{assetsURL}}/img/guide/datatable/column_action.svg) à côté du titre de colonne pour voir le menu déroulant des actions de colonne :

- Épingler des colonnes à gauche ![]({{assetsURL}}/img/guide/datatable/pin_left_25.svg) ou à droite ![]({{assetsURL}}/img/guide/datatable/pin_right_25.svg) du tableau.
- Filtrer les colonnes par numéro, texte ou date (si la configuration le permet). Pour reporter ou non les changements apportés au tableau, il faut appliquer ou effacer les filtres sur la carte (_appliquer_: ![]({{assetsURL}}/img/guide/datatable/filter_toggle_25.svg), _masquer_: ![]({{assetsURL}}/img/guide/datatable/filter_clear_25.svg)).
- Afficher ou masquer des colonnes en cliquant sur l’icône *Cacher colonne* ![]({{assetsURL}}/img/guide/datatable/column_hide_25.svg).
- Parcourir le tableau avec le clavier.

Si vous cliquez sur une couche, le nombre d’éléments accessibles s’affichera sous le titre de la couche.

=3!sortingAndReordering=
#### Tri et réorganisation

Les colonnes du tableau de données peuvent être accompagnées de deux flèches qui montrent la façon dont les données peuvent être triées et réorganisées.

**Trier une colonne :** Cliquez sur le titre d’une colonne pour trier les données qu’elle contient.

- Une flèche vers le haut ![]({{assetsURL}}/img/guide/navigation/up_arrow_20.svg) à côté du titre de colonne indique que les données sont triées par ordre croissant ou alphabétique.
- Une flèche vers le bas ![]({{assetsURL}}/img/guide/navigation/down_arrow_20.svg) à côté du titre de colonne indique que les données sont triées par ordre décroissant ou alphabétique inverse.
- L’absence de flèche à côté du titre de colonne signifie qu’aucun tri n’est appliqué à la colonne.

Les colonnes peuvent être triées en ordre croissant ou décroissant (pour les données numériques) et en ordre alphabétique (pour les données textuelles).

=3!filterData=
#### Filtrer les données

Les données peuvent être filtrées par colonne. Pour voir les filtres, cliquez sur l’icône pour afficher les filtres ![]({{assetsURL}}/img/guide/datatable/filter_toggle_25.svg). S’il y a un champ de saisie en dessous du titre de colonne, c’est que les données de celle-ci peuvent être filtrées.

Il y a trois types de filtres :

- **Texte :** ****Champ de saisie de caractères.
- **Chiffre :** Champs de saisie n’acceptant que les chiffres.
  - Si un minimum et un maximum sont définis, le tri se fera selon une plage.
  - Si seulement un minimum est défini, le tri se fera selon l’opération _plus grand que_.
- **Date :** Semblable au champ pour les chiffres, mais pour les dates.

Pour accéder à d’autres filtres (en fonction du type de données dans la colonne), cliquez sur l’icône d’actions ![]({{assetsURL}}/img/guide/datatable/column_action.svg) à côté du titre de la colonne, puis sur **Filtrer par**.

=3!keyboardNavigation=
#### Navigation avec le clavier

Utilisez la touche de **tabulation** pour parcourir les commandes et les trois grands groupes du tableau :

- Titres de colonne
- Filtres de colonne
- Corps du tableau

Lorsque vous avez sélectionné l’un des grands groupes, vous pouvez utiliser les touches fléchées pour parcourir les cellules du tableau pour ce groupe. La cellule sélectionnée sera mise en évidence.

Pour accéder aux boutons ou aux champs de saisie d’une cellule, assurez-vous de bien sélectionner celle-ci (en utilisant les flèches, comme susmentionné), puis utilisez la touche de **tabulation** pour parcourir les sous-options.

=2!timeSlider=
<a id="timeSliderSection"></a>
### ![]({{assetsURL}}/img/guide/footer/time_slider_30.svg) Curseur temporel [Haut de page](#footerSection)
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**N.B. : Cliquez sur une couche pour afficher son curseur temporel dans la section de droite.**_

L’onglet **Curseur temporel** dans le pied de page se divise en deux sections. La liste des couches ayant un facteur temporel se trouve dans la section de gauche.

Cette case à cocher ![]({{assetsURL}}/img/guide/layers/check.png) contrôle si le curseur temporel filtre les données.
- Lorsque la case est cochée, seules les données correspondant à la date sélectionnée sont affichées.
- Lorsque la case est décochée, toutes les données, peu importe la date, sont affichées.

Une barre de curseur s’affiche avec un ou deux points déplaçables. Pour les couches à facteur temporel ponctuel, il n’y a qu’un point déplaçable. Pour les couches à plage temporelle, il y a deux points déplaçables permettant de régler le début et la fin de la plage.

Cliquez sur le point et déplacez-le sur la barre pour sélectionner les valeurs de filtre souhaitées ou un moment donné dans le temps. Pour une couche à plage temporelle, cliquez sur l’icône de cadenas ![]({{assetsURL}}/img/guide/footer/lock_30.svg) afin de verrouiller le point de début.

Appuyez sur l’icône de lecture ![]({{assetsURL}}/img/guide/footer/play_arrow_30.svg) pour voir les résultats dans le temps. Cliquez sur l’icône de changement de direction ![]({{assetsURL}}/img/guide/footer/direction_arrow_30.svg) pour avancer ou reculer dans le temps.

Cliquez sur l’icône de marche arrière ![]({{assetsURL}}/img/guide/footer/back_arrow_30.svg) ou avant ![]({{assetsURL}}/img/guide/footer/forward_arrow_30.svg) pour reculer ou avancer d’une étape dans le temps.

Ouvrez le menu déroulant du délai pour choisir le délai d’animation du curseur. Certaines couches peuvent avoir besoin d’un délai plus important pour s’afficher correctement sur la carte.

Le champ visé par le filtre s’affiche en bas à gauche de la section du curseur temporel. Des descriptions personnalisées peuvent aussi s’afficher au même endroit.

=2!chart=
<a id="chartSection"></a>
### ![]({{assetsURL}}/img/guide/footer/chart_30.svg) Graphique [Haut de page](#footerSection)
<div style="border-bottom: 1px solid #999999; margin-bottom: 10px; width: 50%;"></div>

_**N.B. : Il faut sélectionner un élément sur la carte pour que la couche devienne cliquable dans la liste, sans quoi elle sera désactivée (grisée).**_

L’onglet **Graphique** dans le pied de page se divise en deux sections. La liste des couches comportant un graphique se trouve dans la section de gauche. Sélectionnez un élément sur la carte pour en voir le graphique dans la section de droite.

Le menu déroulant **Élément** (en haut à gauche de la section du graphique) permet également de sélectionner un élément. Il s’agit d’une fonction pratique lorsque plusieurs éléments sont rapprochés sur la carte et qu’il est difficile de sélectionner celui voulu.

Vous pouvez cocher ou décocher les cases ![]({{assetsURL}}/img/guide/layers/check.png) des données au-dessus du graphique pour déterminer le contenu de celui-ci (seulement pour les couches comportant plusieurs éléments de données).

<img src="{{assetsURL}}/img/guide/footer/checkbox.png" style="width: 90%;"/>

Ouvrez le menu déroulant de **téléchargement** (en haut à droite de la section du graphique) pour télécharger les données du graphique en format JSON. Cliquez sur **Télécharger tout** ou **Télécharger visible** selon que vous voulez télécharger toutes les données ou seulement celles actuellement visibles sur le graphique.

=3!chartTypes=
#### Types de graphiques possibles :

- Graphiques linéaires
- Graphiques à barres
- Graphiques circulaires

Les points d’un graphique linéaire peuvent être transformés en étapes : sélectionnez l’option voulue dans le menu déroulant **Étapes** en haut à gauche de la section du graphique.

Cliquez et déplacez les points sur la barre de curseur du graphique linéaire pour modifier les valeurs des axes X ou Y.

=1!issues=
# Temps de chargement / comportement imprévu
<div style="border-bottom: 2px solid #2a2f39; margin-bottom: 15px;"></div>

Le temps de chargement dépend :

- de l’emplacement du réseau;
- de la bande passante disponible;
- du nombre de couches en chargement;
- du type de couche et de sa taille.

Vous pourriez observer un comportement imprévu de la carte si vous interagissez avec celle-ci avant que les données ne soient complètement chargées. Veuillez laisser la carte se charger entièrement avant d’en utiliser les fonctions.

_N.B. : Si l’indicateur de chargement tourne pour une couche, veuillez attendre qu’il disparaisse avant de lancer une quelconque fonction sur la carte._