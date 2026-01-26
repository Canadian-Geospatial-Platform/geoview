=1!loadingStatus=

# Interaction avec la carte et état de chargement

Ces indicateurs visuels et comportements de navigation contribuent à offrir une expérience fluide et intuitive avec la carte.

## Chargement initial

Lors de l’initialisation du visualiseur de carte, un indicateur de chargement (spinner) s’affiche au-dessus de la carte. Cela signifie que les composants minimum requis sont en cours de chargement. Une fois ceux-ci correctement initialisés, le spinner disparaît pour révéler la carte.

Pendant le chargement initial des couches cartographiques, une barre de progression est visible au bas de la carte. Durant cette phase, certaines fonctionnalités — comme l’exportation de la carte — peuvent ne pas fonctionner comme prévu tant que toutes les couches ne sont pas entièrement chargées. Il est donc recommandé d’éviter les actions intensives jusqu’à la fin du chargement.

Dans le panneau **Légende** ou **Couches**, chaque couche affiche une icône de chargement (spinner) à gauche (à la place de l’icône de couche habituelle) tant qu’elle est en cours de traitement. Une fois la couche rendue correctement pour la première fois, le spinner est remplacé par l’icône correspondante.

## Rechargement des couches

Chaque fois que la carte est **déplacée** ou **zoomée**, certaines couches peuvent repasser en état de chargement. Lorsque cela se produit :

- Dans l'onglet **Couches**, l'encadré de chaque couche en cours de chargement dans la liste des couches (section de gauche) devient vert avec une barre de progression au bas.
- Dans l'onglet **Légende**, une barre de progression apparaît sous le nom du groupe de couches et les contrôles.
- Une barre de progression supplémentaire s'affiche également au bas de la carte, juste au-dessus de la barre d'information, tant qu'au moins une couche est encore en cours de chargement.

## Notifications aux utilisateurs et information sur l'état de la carte

À tout moment, le visualiseur informe l’utilisateur de l’activité en cours en :

- Affichant un message au bas de la carte, et/ou
- Ajoutant une notification accessible depuis le panneau des notifications dans la barre latérale. Lorsqu'une nouvelle notification est ajoutée, un compteur rouge s'incrémente pour indiquer une mise à jour.

## Changer le focus

Vous pouvez changer le focus entre les sections carte et pied de page :

- **Pour mettre le focus sur la carte** : Cliquer sur la barre latérale ou la barre d'information de la carte.
- **Pour mettre le focus sur le pied de page** : Si votre carte comprend une barre de pied de page, cliquer sur celle-ci pour afficher son contenu.

=1!navigationControls=

# Commandes de navigation

Les commandes de navigation permettent d'ajuster l'étendue de la visualisation, la projection, la rotation ou la carte de base.

Selon la configuration de la visionneuse, le coin inférieur droit de la carte contient les commandes de navigation suivantes :

| Symbole                                                                                                                                  | Nom                      | Description                                                                                                                                                                                                                                                                                    |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/navigation/fullscreen.svg" alt="Une icône représentant la fonction « Plein écran »" />                 | Plein écran              | Permet de voir la carte sur toute la page en passant de la taille originale au plein écran.                                                                                                                                                                                                    |
| <img src="{{assetsURL}}/img/guide/navigation/plus.svg" alt="Une icône représentant la fonction « Zoom avant »" />                        | Zoom avant               | Permet de faire un zoom avant d'un niveau à la fois pour voir le contenu plus en détail; fonctionne aussi avec la touche d'addition du clavier (+).                                                                                                                                            |
| <img src="{{assetsURL}}/img/guide/navigation/minus.svg" alt="Une icône représentant la fonction « Zoom arrière »" />                     | Zoom arrière             | Permet de faire un zoom arrière d'un niveau à la fois pour voir le contenu moins en détail; fonctionne aussi avec la touche de soustraction du clavier (-).                                                                                                                                    |
| <img src="{{assetsURL}}/img/guide/navigation/360.svg" alt="Une icône représentant la fonction « Rotation de la carte »" />               | Rotation de la carte     | Permet de contrôler la rotation de la carte avec un curseur de -180° à +180°. Le panneau comprend un bouton à bascule **Nord fixe** (disponible pour la projection LCC) pour garder la carte orientée le nord au haut, et un bouton de réinitialisation pour revenir à l'orientation initiale. |
| <img src="{{assetsURL}}/img/guide/navigation/geolocation.svg" alt="Une icône représentant la fonction « Géolocalisation »" />            | Géolocalisation          | Permet de zoomer et de déplacer la carte sur votre position géographique.                                                                                                                                                                                                                      |
| <img src="{{assetsURL}}/img/guide/navigation/home.svg" alt="Une icône représentant la fonction « Vue initiale »" />                      | Vue initiale             | Permet de zoomer et de déplacer la carte pour retourner à la vue initiale.                                                                                                                                                                                                                     |
| <img src="{{assetsURL}}/img/guide/navigation/basemapSelect.svg" alt="Une icône représentant la fonction « Changer la carte de base »" /> | Changer la carte de base | Permet de changer la carte de base.                                                                                                                                                                                                                                                            |
| <img src="{{assetsURL}}/img/guide/navigation/projection.svg" alt="Une icône représentant la fonction « Changer la projection »" />       | Changer la projection    | Permet de changer la projection de la carte entre Web Mercator et LCC.                                                                                                                                                                                                                         |

Vous pouvez aussi déplacer la carte avec les touches fléchées vers la gauche, la droite, le haut et le bas, ou en cliquant sur la carte et en la faisant glisser. Lorsque le pointeur est sur la carte, la molette de la souris permet de faire un zoom avant et arrière.

Appuyez sur la touche **Maj.** tout en cliquant et en déplaçant la souris pour définir une zone sur la carte. Relâchez la souris; le zoom se fait sur la zone sélectionnée.

Appuyez sur les touches **Maj.** et **Alt.** tout en cliquant et en déplaçant la souris pour faire tourner la carte.

_N.B. : La carte doit être focalisée pour que les combinaisons de touches fonctionnent._

=2!overviewMap=

## Carte d’aperçu

Selon la configuration de la visionneuse, la carte peut fournir une carte d'aperçu, une représentation générique de la carte principale à une taille réduite. Elle est située dans le coin supérieur droit de la carte.

<img src="{{assetsURL}}/img/guide/navigation/overview.png" alt="Carte d'aperçu affichée dans le coin supérieur droit de la carte principale" style="max-width: 500px;"/>

Cliquez sur l'encadré dans la carte d'aperçu et déplacez-le pour modifier la vue sur la carte principale. Cliquez sur l'icône de basculement dans le coin supérieur droit pour afficher ou masquer la carte d'aperçu.

=2!keyboardNavigation=

## Navigation avec le clavier

Les personnes qui ne peuvent pas utiliser de souris peuvent choisir de naviguer avec le clavier. Utilisez la touche de **tabulation** pour atteindre les liens et les commandes sur la page. Appuyez sur **Maj.** et la touche de **tabulation** pour revenir à l’élément précédent. Utilisez la touche **Entrée** ou la **barre d’espace** pour activer les liens et les commandes.

Si vous utilisez la touche de **tabulation** pour naviguer dans la carte, la fenêtre contextuelle **Navigation clavier** s’affichera. Sélectionnez le bouton **Activer** et appuyez sur **Entrée** pour utiliser la navigation avec le clavier.

Lorsque la carte est focalisée, un pointeur en croix s'affiche en son centre :

<img src="{{assetsURL}}/img/guide/navigation/crosshair.svg" alt="Pointeur en croix affiché au centre de la carte pour la navigation au clavier" style="width: 90%; height: 100px;"/>

Utilisez les touches **fléchées** pour déplacer la carte et les touches **+** et **-** pour faire un zoom avant ou arrière. Appuyez sur **Entrée** pour sélectionner un élément sous le pointeur en croix et en voir les données dans le panneau **Détails**.

Pour les éléments pris en charge, l’information s’affiche lorsque le pointeur en croix les survole.

Appuyez sur **Ctrl** et **Q** pour quitter la navigation avec le clavier.

_N.B. : La carte doit être focalisée pour que les combinaisons de touches fonctionnent. La carte est focalisée lorsque le pointeur en croix s’affiche._

**Accessibilité**

La carte n’est pas pleinement conforme au niveau AA des Règles pour l’accessibilité des contenus Web (WCAG) 2.0.

=1!mapInformationBar=

# Barre d’information sur la carte

Cliquez sur le chevron vers le haut <img src="{{assetsURL}}/img/guide/navigation/chevron_up.svg" alt="Icône chevron vers le haut" /> à gauche pour développer ou réduire la barre.

Les détails et fonctionnalités de navigation suivants sont accessibles dans la barre d'information sur la carte (il est nécessaire de développer la barre pour afficher toutes les options) :

| Symbole                                                                                                                              | Nom                       | Description                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/navigation/attribute.svg" alt="Une icône représentant la fonction « Attributs »" />                | Attributs                 | Droits d'auteur et autres attributs de la carte.                                                                                                                                                                                                                                                                                                                |
|                                                                                                                                      | Coordonnées géographiques | Cliquez sur les coordonnées pour passer d’un format de coordonnées à l’autre : degrés, minutes et secondes (DMS), degrés décimaux ou coordonnées projetées.                                                                                                                                                                                                     |
|                                                                                                                                      | Échelle de la carte       | Cliquez sur l’échelle de la carte pour basculer entre l’échelle et la résolution.                                                                                                                                                                                                                                                                               |
| <img src="{{assetsURL}}/img/guide/navigation/north_arrow.svg" alt="Une icône représentant la fonction « Indicateur de rotation »" /> | Indicateur de rotation    | Affiche l'angle de rotation actuel de la carte. Passez le curseur sur l'icône de la flèche nord pour voir une info-bulle indiquant la rotation de la carte et la composante de rotation basée sur la projection. Il s'agit d'un affichage d'information; utilisez le bouton **Rotation de la carte** dans les commandes de navigation pour ajuster la rotation. |

=1!sidebar=

# Barre latérale

La barre latérale, située sur le côté gauche de la carte, permet d'accéder aux outils et fonctionnalités disponibles.

_Les outils affichés peuvent varier en fonction de la configuration de la carte._

_N.B. : Certains outils dans la barre latérale se trouvent aussi sous forme d’onglet dans le pied de page, comme **Légende**, **Couches**, **Données** et **Détails**. Lorsqu’ouverts à partir de la barre latérale, **Légende** et **Détails** s’affichent sur la carte dans un format « mobile » condensé (une seule colonne). Ouverts à partir du pied de page, ils s’affichent comme onglets au bas de la carte dans un format détaillé complet._

| Symbole                                                                                                                     | Nom                 | Description                                                                                                  |
| --------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------ |
| <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" alt="Une icône représentant la fonction « Géolocalisation »" /> | Géolocalisation     | Cliquez sur l'icône de géolocalisation; un champ de recherche s'affiche sur la carte.                        |
| <img src="{{assetsURL}}/img/guide/sidebar/legend.svg" alt="Une icône représentant la fonction « Légende »" />               | Légende             | Légende des icônes de la carte (_voir la section sur le pied de page pour en savoir plus_).                  |
| <img src="{{assetsURL}}/img/guide/footer/layers_30.svg" alt="Une icône représentant la fonction « Couches »" />             | Couches             | Outil de gestion des couches (_voir la section sur le pied de page pour en savoir plus_).                    |
| <img src="{{assetsURL}}/img/guide/sidebar/details.svg" alt="Une icône représentant la fonction « Détails »" />              | Détails             | Information détaillée des éléments sélectionnés (_voir la section sur le pied de page pour en savoir plus_). |
| <img src="{{assetsURL}}/img/guide/footer/data_table.svg" alt="Une icône représentant la fonction « Données »" />            | Données             | Table d'information détaillée des éléments (_voir la section sur le pied de page pour en savoir plus_).      |
| <img src="{{assetsURL}}/img/guide/sidebar/guide.svg" alt="Une icône représentant la fonction « Guide »" />                  | Guide               | Guide d'aide.                                                                                                |
| <img src="{{assetsURL}}/img/guide/sidebar/export.svg" alt="Une icône représentant la fonction « Télécharger »" />           | Télécharger         | Télécharger la carte en format PNG, JPEG ou PDF. Désactivé pendant le chargement des couches.                |
| <img src="{{assetsURL}}/img/guide/sidebar/notifications.svg" alt="Une icône représentant la fonction « Notifications »" />  | Notifications       | Affichage des messages et notifications pour la carte.                                                       |
| <img src="{{assetsURL}}/img/guide/sidebar/about.svg" alt="Une icône représentant la fonction « À propos de GéoView »" />    | À propos de GéoView | Affiche les renseignements sur le visualiseur GéoView.                                                       |

=2!geolocator=

<a id="geolocatorSection">

## <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" alt="Icône de géolocalisation" /> Géolocalisation

Permet de rechercher des endroits au Canada. Si vous cliquez sur l'icône de géolocalisation <img src="{{assetsURL}}/img/guide/geosearch/geolocator.svg" alt="Icône de géolocalisation" /> dans la barre latérale, un champ de recherche s'affichera sur la carte.

=3!supportedSearchTypes=

### Types de recherches possibles

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

### Filtres de recherche géographique

Les résultats d'une recherche d'emplacement s'affichent dans un panneau sous le champ de recherche. Le panneau de résultats comprend deux menus déroulants permettant de filtrer les résultats par **province** et par **catégorie** (lac, village, rivière, etc.). Un bouton <img src="{{assetsURL}}/img/guide/geosearch/clear.svg" alt="Une icône représentant la fonction Effacer" /> se trouve à droite des menus, qui, lorsqu'on clique dessus, efface les options de filtre sélectionnées.

=2!export=

<a id="exportSection">

## <img src="{{assetsURL}}/img/guide/sidebar/export.svg" alt="Icône de téléchargement" /> Télécharger

Vous pouvez télécharger une image de la carte avec ses couches visibles, la légende, le titre, la flèche du nord, la barre d'échelle et un horodatage.

**Remarque :** Le bouton Télécharger est désactivé pendant le chargement des couches. Il devient actif une fois que toutes les couches sont complètement chargées.

Lorsque vous cliquez sur le bouton **Télécharger**, une fenêtre de dialogue s'ouvre avec les options suivantes :

**Options de la boîte de dialogue :**

| Option            | Emplacement          | Description                                                                                                                                              |
| ----------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Titre de la carte | Centre supérieur     | Entrez un titre optionnel à afficher en haut de l'image de la carte.                                                                                     |
| Format d'image    | Coin inférieur droit | Choisissez parmi les formats **PNG**, **JPEG** ou **PDF**.                                                                                               |
| Résolution (PPP)  | Coin inférieur droit | Sélectionnez la résolution de l'image. Une résolution plus élevée produit des images plus grandes et plus détaillées.                                    |
| Qualité (JPEG)    | Coin inférieur droit | Lorsque **JPEG** est sélectionné, ajustez la qualité de l'image. Une qualité plus élevée produit de meilleures images mais des fichiers plus volumineux. |

Cliquez sur le bouton **Télécharger** au bas de la fenêtre pour générer et télécharger l'image finale de la carte.

=1!footerPanel=

# Pied de page

<a id="footerSection"></a>
Le _pied de page_ se trouve sous la carte. Vous pouvez le développer en cliquant sur un des onglets de son menu. Pour le réduire, vous n’avez qu’à recliquer sur l’onglet actif.

**Pour passer de la carte à la section du pied de page, cliquez sur la barre d'information de la carte pour afficher la carte, ou cliquez sur la barre du pied de page pour afficher son contenu.**

_Les onglets affichés peuvent varier en fonction de la configuration de la carte._

Le menu du _pied de page_ se compose des onglets suivants :

- <a href="#legendSection">Légende</a>
- <a href="#layersSection">Couches</a>
- <a href="#detailsSection">Détails</a>
- <a href="#dataTableSection">Données</a>
- <a href="#timeSliderSection">Curseur temporel</a>
- <a href="#chartSection">Graphique</a>
- Guide

_N.B. : Certains onglets dans la barre latérale se trouvent aussi sous forme d’outils dans la barre latérale, comme **Légende**, **Couches**, **Données** et **Détails**. Lorsqu’ouverts à partir de la barre latérale, **Légende** et **Détails** s’affichent sur la carte dans un format « mobile » condensé. Ouverts à partir du pied de page, ils s’affichent comme onglets au bas de la carte dans un format détaillé complet._

=2!legend=

<a id="legendSection"></a>

## <img src="{{assetsURL}}/img/guide/sidebar/legend.svg" alt="Icône de légende" /> Légende <a href="#footerSection">Haut de page</a>

L'onglet **Légende** présente les symboles des couches affichées sur la carte.

Chaque couche a ses symboles. Pour les couches à éléments simples, il n'y a qu'une seule icône <img src="{{assetsURL}}/img/guide/footer/icon_single.png" alt="Une icône représentant une couche Simple" /> à côté du nom de la couche.

Pour celles à éléments complexes (plusieurs symboles par couche), les icônes prennent la forme d'une pile <img src="{{assetsURL}}/img/guide/footer/icon_multiple.png" alt="Une icône représentant une Pile de couches" /> (placez votre pointeur sur la pile pour voir les icônes).

Vous pouvez développer ou réduire la liste des symboles d'une couche sous son nom. Certaines couches ont parfois une légende graphique; le cas échéant, elle sera de la même manière.

Lorsqu'une couche comporte plusieurs symboles, vous pouvez activer ou désactiver la visibilité des éléments individuels en cliquant sur l'étiquette de l'élément ou sur la barre grise à gauche de celui-ci. Une barre gris foncé indique que l'élément est visible, tandis qu'une barre gris clair indique qu'il n'est pas visible.

| Symbole                                                                                                                                  | Nom                                | Description                                                                                                                                                                        |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/footer/layers_30.svg" alt="Une icône représentant la fonction « Lien vers la couche »" />              | Voir dans le panneau Couches       | Naviguer vers la couche correspondante dans le panneau Couches.                                                                                                                    |
| <img src="{{assetsURL}}/img/guide/layers/scaleVisible.svg" alt="Une icône représentant la fonction « Zoom sur l'échelle visible »" />    | Zoom sur l'échelle visible         | Zoom sur l'échelle visible de la couche, un déplacement de la carte peut être nécessaire pour localiser les éléments. _N.B. : Seulement disponible quand la couche est hors zoom_. |
| <img src="{{assetsURL}}/img/guide/footer/view_25.svg" alt="Une icône représentant la fonction « Basculer la visibilité »" />             | Basculer la visibilité             | Basculer la visibilité de la couche.                                                                                                                                               |
| <img src="{{assetsURL}}/img/guide/layers/highlight_60.svg" alt="Une icône représentant la fonction « Couche mise en évidence »" />       | Couche mise en évidence            | Place la couche au premier plan, diminue l'opacité des autres couches et affiche le périmètre de la couche.                                                                        |
| <img src="{{assetsURL}}/img/guide/layers/zoom_60.svg" alt="Une icône représentant la fonction « Zoom sur le périmètre de la couche »" /> | Zoom sur le périmètre de la couche | Déplace la carte et fait un zoom pour que le périmètre de la couche soit visible.                                                                                                  |

_N.B. : Lorsque la couche est cachée, les fonctions affectant la couche sur la carte sont désactivées et le texte de la couche est gris et en italique._

=2!layers=

<a id="layersSection"></a>

## <img src="{{assetsURL}}/img/guide/footer/layers_30.svg" alt="Icône couches" /> Couches <a href="#footerSection">Haut de page</a>

L’onglet **Couches** comprend les sous-menus suivants :

- Vue
- Ajouter

=3!view=

### <img src="{{assetsURL}}/img/guide/footer/view_25.svg" alt="Icône vue" /> Vue

_**N.B. : Cliquez sur une couche pour afficher ses information dans la section de droite.**_

**Information importante**  
Si l'icône de visibilité (œil) d'une couche est désactivée (grisée) <img src="{{assetsURL}}/img/guide/footer/eye_disabled.svg" alt="Une icône représentant la fonction Œil désactivé" /> et que l'icône Zoom sur l'échelle visible <img src="{{assetsURL}}/img/guide/layers/scaleVisible.svg" alt="Icône zoom sur l'échelle visible" /> est visible, cela signifie que la couche n'est pas visible au niveau de zoom actuel de la carte.

- En cliquant sur le bouton Zoom sur l'échelle visible, la carte sera ajustée au niveau de zoom approprié, ce qui rendra la couche visible.
- Cependant, après avoir effectué un zoom, il se peut que vous ne voyiez pas immédiatement les éléments s'il n'y a pas de données dans la zone de visualisation actuelle.
- Dans ce cas, vous devrez peut-être effectuer un déplacement de la carte pour localiser les éléments.

Le sous-menu **Vue** de l’onglet **Couches** se divise en deux sections. La section de gauche présente les couches affichées sur la carte. Si vous cliquez sur une couche, ses paramètres (options accessibles pour la couche) s’afficheront dans la section de droite.

**Icônes de couche**

Chaque couche a ses symboles. Pour les couches à éléments simples, il n'y a qu'une seule icône <img src="{{assetsURL}}/img/guide/footer/icon_single.png" alt="Une icône représentant une couche Simple" /> à côté du nom de la couche. Pour celles à éléments complexes (plusieurs symboles par couche), les icônes prennent la forme d'une pile (placez votre pointeur sur la pile pour voir les icônes <img src="{{assetsURL}}/img/guide/footer/icon_multiple.png" alt="Une icône représentant une Pile de couches" />).

**Groupe de couches**

L'icône de groupe <img src="{{assetsURL}}/img/guide/layers/group.svg" alt="Une icône représentant la fonction Groupe" /> indique un groupe de couches. Cliquez sur le groupe pour voir la liste des sous-couches. Les sous-couches peuvent elles aussi être des groupes de couches.

**Affichage des couches**

Cliquez sur l'icône d'œil à côté de chaque couche pour afficher <img src="{{assetsURL}}/img/guide/footer/eye.svg" alt="Une icône représentant la fonction Œil visible" /> ou masquer <img src="{{assetsURL}}/img/guide/footer/eye_not_visible.svg" alt="Une icône représentant la fonction Œil non visible" /> la couche sur la carte.

Les couches qui ne sont pas actuellement affichées sur la carte sont grisées et leur texte est en italique.

Si une couche est toujours visible, ou pour les couches dont le couche parent est caché, l'icône d'affichage (œil) est désactivée (grisée) <img src="{{assetsURL}}/img/guide/footer/eye_disabled.svg" alt="Une icône représentant la fonction Œil désactivé" />.

**Trier les couches**

Vous pouvez facilement modifier l'ordre des couches en cliquant sur les flèches directionnelles. Notez que ces icônes ne deviennent visibles qu'une fois qu'une couche spécifique est sélectionné.

**Types de couches pris en charge**

Les couches peuvent être en format de trame ou vectoriel. Voici les types de couches pris en charge :

| Couches en format de trame    | Couches en format vectoriel |
| ----------------------------- | --------------------------- |
| Dynamique ESRI                | Entités ESRI                |
| Imagerie ESRI                 | GeoJSON                     |
| Tuile XYZ                     | Couche d’entités OGC API    |
| WMS                           | CSV                         |
| Image statique                | WFS                         |
| Couche de tuiles vectorielles |

_N.B. : Si une couche ne se charge pas correctement, un message d’erreur s’affichera dans l’outil de *notification* de la barre latérale. Au lieu d’utiliser les actions standard pour les couches, vous pouvez soit recharger la couche (surtout utile s’il y a un problème temporaire de connexion réseau), soit la retirer. Si vous retirez la couche, elle sera retirée complètement du sélecteur de couches._

=3!layerSettings=

#### Paramètres des couches

Dans l’onglet **Vue**, si vous cliquez sur une couche dans la section de gauche, ses paramètres s’afficheront dans celle de droite.

_N.B. : Les paramètres accessibles dépendent de plusieurs facteurs, comme le type de couche et la configuration._

| Symbole                                                                                                                            | Nom                                   | Description                                                                                                                                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| <img src="{{assetsURL}}/img/guide/layers/table_view_60.svg" alt="Une icône représentant la fonction « Table détaillée »" />        | Table détaillée                       | Ouvre une vue de table de base avec des fonctionnalités simplifiées. Pour la table avancée complète, si disponible, accédez directement au panneau Tableau de Données ou ouvrez-le depuis la table de base. |
| <img src="{{assetsURL}}/img/guide/layers/time_slider_30.svg" alt="Une icône représentant la fonction « Curseur Temporel »" />      | Voir dans le panneau Curseur Temporel | Ouvre le panneau Curseur Temporel pour cette couche, vous permettant de visualiser les données temporelles.                                                                                                 |
| <img src="{{assetsURL}}/img/guide/layers/refresh_60.svg" alt="Une icône représentant la fonction « Réinitialiser la couche »" />   | Réinitialiser la couche               | Réinitialiser la couche dans sont état initial.                                                                                                                                                             |
| <img src="{{assetsURL}}/img/guide/layers/highlight_60.svg" alt="Une icône représentant la fonction « Couche mise en évidence »" /> | Couche mise en évidence               | Place la couche au premier plan, diminue l'opacité des autres couches et affiche le périmètre de la couche.                                                                                                 |
| <img src="{{assetsURL}}/img/guide/layers/zoom_60.svg" alt="Une icône représentant la fonction « Zoom sur la couche »" />           | Zoom sur la couche                    | Déplace la carte et fait un zoom pour que le périmètre de la couche soit visible.                                                                                                                           |
| <img src="{{assetsURL}}/img/guide/layers/remove_25.svg" alt="Une icône représentant la fonction Retirer" />                      | Retirer                             | Retirer cette couche de la carte.                  |
| Curseur                                                                                                                            | Opacité                               | Curseur permettant d'augmenter ou de diminuer l'opacité de la couche.                                                                                                                                       |

_N.B. : Lorsque la couche est cachée, les fonctions affectant la couche sur la carte sont désactivées._

**Classes de couches**

Si la couche possède des classes, elles seront indiquées dans ses paramètres. Cochez ou décochez la case à côté de la classe pour afficher ou masquer celle-ci.

On voit le nombre de classes visibles sous le nom de la couche.

**Plus d'informations**

Des détails techniques supplémentaires sur la couche sont affichés dans cette section, qui peut inclure :

- **Type** : Le type de couche (p. ex., service dynamique ESRI, GeoJSON, WMS)
- **Projection du service** : Le système de référence de coordonnées utilisé par le service (p. ex., EPSG:3978, EPSG:3857)
- **Dimension temporelle** : Si la couche contient des données temporelles, cela indique le nom du champ et la plage de dates minimum/maximum
- **Ressource** : L'URL ou le chemin vers la source de données

**Attribution**

Si des informations d'attribution sont disponibles pour la couche, elles seront affichées dans cette section. L'attribution comprend généralement les avis de droits d'auteur, les sources de données et les remerciements requis par le fournisseur de données.

=3!add=

### <img src="{{assetsURL}}/img/guide/layers/add_25.svg" alt="Icône ajouter" /> Ajouter

Vous pouvez ajouter des couches au visualiseur de cartes dans le sous-menu **Ajouter** de l’onglet **Couches**.

Marche à suivre :

- Pour ajouter un fichier, vous pouvez soit glisser le fichier dans l’assistant d’importation, soit cliquer sur le bouton **Choisir un fichier**, soit entrer l’URL du fichier.
- Les types de fichiers acceptés sont les fichiers GeoJSON (.json ou .geojson), les fichiers GeoPackage (.gpkg), les fichiers CSV (.csv) contenant des valeurs de coordonnées, les fichiers shapefile (.shp) ou les fichiers ZIP (.zip) contenant un fichier shapefile.
- Pour ajouter un service, entrez l’URL du service dans le champ de texte.
- Cliquez sur le bouton **Continuer** pour passer à la prochaine étape.
- Vérifiez que le bon format de fichier ou de service est sélectionné dans le menu déroulant. S’il est erroné, vous recevrez un message d’erreur vous demandant de choisir un autre format.
- Cliquez sur le bouton **Continuer** pour passer à la prochaine étape. Le format de fichier (p. ex. CSV) devrait s’afficher.
- Selon le type d’ensemble de données ajouté, vous pourrez configurer différents paramètres à l’étape finale.
- Cliquez sur le bouton **Continuer** pour insérer la couche dans la carte.

Le visualiseur passe automatiquement à la fonction **Vue**.

=2!details=

<a id="detailsSection"></a>

## <img src="{{assetsURL}}/img/guide/sidebar/details_30.svg" alt="Icône détails" /> Détails <a href="#footerSection">Haut de page</a>

_**N.B. : Il faut sélectionner un élément sur la carte pour que la couche devienne cliquable dans la liste, sans quoi elle sera désactivée (grisée).**_

L'onglet **Détails** se divise en deux sections : une liste de couches à gauche et les détails des éléments à droite.

**Mode d'emploi :**

1. **Cliquez sur la carte** pour interroger les éléments à cet emplacement
2. Les couches contenant des éléments à l'emplacement cliqué seront activées dans la section de gauche, affichant le nombre d'éléments trouvés
3. Les couches sans éléments restent désactivées (grisées)
4. **Cliquez sur une couche** dans la section de gauche pour voir les détails de ses éléments dans la section de droite
5. Si l'élément possède une géométrie appropriée, il sera mis en surbrillance sur la carte
6. Lors d'une nouvelle requête, la couche précédemment sélectionnée restera sélectionnée si des éléments sont trouvés

### Effacer toutes les surbrillances

Le bouton <img src="{{assetsURL}}/img/guide/layers/clear_highlight_30.svg" alt="Une icône représentant la fonction Effacer les surbrillances" /> permet d'affacer toutes les surbrillances. Il est situé dans le coin supérieur droit au-dessus de la liste des couches. Cliquez sur ce bouton pour supprimer toutes les surbrillances d'éléments de la carte.

### Section des détails des éléments (droite)

La section des détails affiche les informations de l'élément sélectionné et fournit les outils suivants :

| Symbole                                                                                                                               | Nom                              | Description                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Flèches (← →)                                                                                                                         | Navigation entre les éléments    | Parcourir les éléments multiples de la couche sélectionnée.                                          |
| <img src="{{assetsURL}}/img/guide/footer/chart_30.svg" alt="Une icône représentant la fonction « Voir dans le panneau Graphique »" /> | Voir dans le panneau Graphique   | Ouvre le panneau Graphique pour cet élément (disponible uniquement si un graphique est configuré).   |
| <img src="{{assetsURL}}/img/guide/layers/highlight_30.svg" alt="Une icône représentant la fonction « Mise en surbrillance »" />       | Garder l'élément en surbrillance | Garder l'élément en surbrillance sur la carte. Lorsque sélectionnée, l'icône est remplie de couleur. |
| <img src="{{assetsURL}}/img/guide/datatable/zoom.svg" alt="Une icône représentant la fonction « Zoom »" />                            | Zoomer sur l'élément             | Zoomer la carte sur l'étendue de l'élément sélectionné.                                              |

Le nombre d'éléments pour la couche sélectionnée est indiqué en haut à gauche de la section des détails.

### Afficher les informations de coordonnées

Lorsque l'option **Afficher les informations de coordonnées** est activée, cliquer sur la carte affichera les informations de localisation incluant :

- Les coordonnées de l'emplacement cliqué dans divers formats
- Les références des feuilles SNRC (Système national de référence cartographique) aux échelles 50k et 250k
- Les données d'élévation pour l'emplacement cliqué
- Les coordonnées UTM (projection transverse universelle de Mercator)

Lorsque les informations de coordonnées sont activées, elles apparaîtront comme premier élément dans la liste des couches, offrant un accès rapide aux informations de référence géographique pour tout emplacement sur la carte.

**N.B. :** Lorsque le panneau Détails est fermé, toutes les surbrillances sélectionnées sont automatiquement supprimées de la carte.

=2!dataTable=

<a id="dataTableSection"></a>

## <img src="{{assetsURL}}/img/guide/footer/data_table.svg" alt="Icône tableau de données" /> Données <a href="#footerSection">Haut de page</a>

_**N.B. : Cliquez sur une couche pour afficher ses données dans la section de droite.**_

Si vous cliquez sur une couche, le nombre d’éléments accessibles s’affichera sous le titre de la couche.

**Informations importantes sur la navigation**

- Vous pouvez demander des données à partir d'une seule table à la fois. Pendant l'extraction des données, tous les boutons _couches_ sont désactivés.
- La couche sélectionnée sera en vert et un message de progression apparaîtra au bas de la section carte.
- Une fois la recherche de données terminée, tous les boutons _couches_ sont réactivés.
- Si vous passez à un autre onglet pendant le processus, vous devrez resélectionner la couche lorsque vous reviendrez à l'onglet _Données_ pour afficher les résultats.

L’onglet **Données** se divise en deux sections. La liste des couches se trouve à gauche, et les données des couches, à droite. Cliquez sur une couche pour en voir les données dans le tableau de droite.

### Commandes de l’onglet Données

Les commandes de l’onglet **Données** se trouvent dans le coin supérieur droit du panneau des données de couche.

_N.B. : Selon différents facteurs, certaines options sont désactivées ou présélectionnées._

| Symbole                                                                                                                                    | Nom                           | Description                                                                                                                                        |
| ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Interrupteur                                                                                                                               | Filtrer la carte              | Appliquer les filtres à la carte.                                                                                                                  |
| Interupteur                                                                                                                                | Afficher/masquer les filtres  | Basculer entre l'affichage et le masquage des filtres de colonnes.                                                                                 |
| <img src="{{assetsURL}}/img/guide/datatable/filter_clear.svg" alt="Une icône représentant la fonction « Effacer les filters »" />          | Effacer les filters           | Effacer tout les filtres de colonnes de la table.                                                                                                  |
| <img src="{{assetsURL}}/img/guide/datatable/column_show.svg" alt="Une icône représentant la fonction « Afficher/masquer les colonnes »" /> | Afficher/masquer les colonnes | Choisir les colonnes visibles et épingler des colonnes à gauche ou à droite du tableau.                                                            |
| <img src="{{assetsURL}}/img/guide/datatable/density.svg" alt="Une icône représentant la fonction « Densité »" />                           | Changer la densité            | Modifier la hauteur des lignes du tableau de données.                                                                                              |
| <img src="{{assetsURL}}/img/guide/datatable/export.svg" alt="Une icône représentant la fonction « Télécharger »" />                        | Télécharger                   | Télécharger le tableau en format CSV ou GeoJSON. Pourrait échouer sur un appareil mobile en raison des restrictions de téléchargement de fichiers. |

Les trois premières colonnes du tableau de données sont **Icône**, **Zoom** et **Détails**. Les autres colonnes varient selon la couche sélectionnée.

En plus de parcourir les données, vous pouvez :

- Accéder à la vue modale détaillée d'un élément en cliquant sur l'icône de détails <img src="{{assetsURL}}/img/guide/sidebar/details_30.svg" alt="Une icône représentant la fonction Détails" />.
- Zoomer sur la carte à l'emplacement de l'élément en cliquant sur l'icône de zoom <img src="{{assetsURL}}/img/guide/datatable/zoom.svg" alt="Une icône représentant la fonction Zoom" />.

Cliquez sur l'icône d'actions <img src="{{assetsURL}}/img/guide/datatable/column_action.svg" alt="Une icône représentant la fonction Actions de colonne" /> à côté du titre de colonne pour voir le menu déroulant des actions de colonne :

- Épingler des colonnes à gauche <img src="{{assetsURL}}/img/guide/datatable/pin_left_25.svg" alt="Une icône représentant la fonction Épingler à gauche" /> ou à droite <img src="{{assetsURL}}/img/guide/datatable/pin_right_25.svg" alt="Une icône représentant la fonction Épingler à droite" /> du tableau.
- Filtrer les colonnes par numéro, texte ou date (si la configuration le permet). Pour effacer les filtres, utiliser <img src="{{assetsURL}}/img/guide/datatable/filter_clear.svg" alt="Une icône représentant la fonction Effacer les filters" />.
- Afficher ou masquer des colonnes en cliquant sur l'icône _Cacher colonne_ <img src="{{assetsURL}}/img/guide/datatable/column_hide_25.svg" alt="Une icône représentant la fonction Cacher colonne" />.
- Parcourir le tableau avec le clavier.

=3!sortingAndReordering=

#### Tri et réorganisation

Les colonnes du tableau de données peuvent être accompagnées de deux flèches qui montrent la façon dont les données peuvent être triées et réorganisées.

**Trier une colonne :** Cliquez sur le titre d’une colonne pour trier les données qu’elle contient.

- Une flèche vers le haut <img src="{{assetsURL}}/img/guide/navigation/up_arrow_20.svg" alt="Une icône représentant la fonction Flèche vers le haut" /> à côté du titre de colonne indique que les données sont triées par ordre croissant ou alphabétique.
- Une flèche vers le bas <img src="{{assetsURL}}/img/guide/navigation/down_arrow_20.svg" alt="Une icône représentant la fonction Flèche vers le bas" /> à côté du titre de colonne indique que les données sont triées par ordre décroissant ou alphabétique inverse.
- L’absence de flèche à côté du titre de colonne signifie qu’aucun tri n’est appliqué à la colonne.

Les colonnes peuvent être triées en ordre croissant ou décroissant (pour les données numériques) et en ordre alphabétique (pour les données textuelles).

=3!filterData=

#### Filtrer les données

Les données peuvent être filtrées par colonne. Pour voir les filtres, utilisez l'interrupteur **Afficher/Masquer les filtres** dans les contrôles du tableau de données. S'il y a un champ de saisie en dessous du titre de colonne, c'est que les données de celle-ci peuvent être filtrées.

Il y a trois types de filtres :

- **Texte :** Champ de saisie de caractères.
- **Chiffre :** Champs de saisie n’acceptant que les chiffres.
  - Si un minimum et un maximum sont définis, le tri se fera selon une plage.
  - Si seulement un minimum est défini, le tri se fera selon l’opération _plus grand que_.
- **Date :** Semblable au champ pour les chiffres, mais pour les dates.

Pour accéder à d'autres filtres (en fonction du type de données dans la colonne), cliquez sur l'icône d'actions <img src="{{assetsURL}}/img/guide/datatable/column_action.svg" alt="Une icône représentant la fonction Actions de colonne" /> à côté du titre de la colonne, puis sur **Filtrer par**.

=3!keyboardNavigation=

### Navigation avec le clavier

Utilisez la touche de **tabulation** pour parcourir les commandes et les trois grands groupes du tableau :

- Titres de colonne
- Filtres de colonne
- Corps du tableau

Lorsque vous avez sélectionné l’un des grands groupes, vous pouvez utiliser les touches fléchées pour parcourir les cellules du tableau pour ce groupe. La cellule sélectionnée sera mise en évidence.

Pour accéder aux boutons ou aux champs de saisie d’une cellule, assurez-vous de bien sélectionner celle-ci (en utilisant les flèches, comme susmentionné), puis utilisez la touche de **tabulation** pour parcourir les sous-options.

=2!timeSlider=

<a id="timeSliderSection"></a>

## <img src="{{assetsURL}}/img/guide/footer/time_slider_30.svg" alt="Icône curseur temporel" /> Curseur temporel <a href="#footerSection">Haut de page</a>

_**N.B. : Cliquez sur une couche pour afficher son curseur temporel dans la section de droite.**_

L’onglet **Curseur temporel** dans le pied de page se divise en deux sections. La liste des couches ayant un facteur temporel se trouve dans la section de gauche.

L'interrupteur **Filtrage temporel** contrôle si le curseur temporel filtre les données.

- Lorsqu'il est activé, seules les données correspondant à la date sélectionnée sont affichées.
- Lorsqu'il est désactivé, toutes les données, peu importe la date, sont affichées.

Une barre de curseur s'affiche avec un ou deux points déplaçables. Pour les couches à facteur temporel ponctuel, il n'y a qu'un point déplaçable. Pour les couches à plage temporelle, il y a deux points déplaçables permettant de régler le début et la fin de la plage.

Cliquez sur le point et déplacez-le sur la barre pour sélectionner les valeurs de filtre souhaitées ou un moment donné dans le temps. Pour une couche à plage temporelle, cliquez sur l'icône de cadenas <img src="{{assetsURL}}/img/guide/footer/lock_30.svg" alt="Une icône représentant la fonction Cadenas" /> afin de verrouiller le point de début.

Appuyez sur l'icône de lecture <img src="{{assetsURL}}/img/guide/footer/play_arrow_30.svg" alt="Une icône représentant la fonction Lecture" /> pour voir les résultats dans le temps. Cliquez sur l'icône de changement de direction <img src="{{assetsURL}}/img/guide/footer/direction_arrow_30.svg" alt="Une icône représentant la fonction Changement de direction" /> pour avancer ou reculer dans le temps.

Cliquez sur l'icône de marche arrière <img src="{{assetsURL}}/img/guide/footer/back_arrow_30.svg" alt="Une icône représentant la fonction Flèche arrière" /> ou avant <img src="{{assetsURL}}/img/guide/footer/forward_arrow_30.svg" alt="Une icône représentant la fonction Flèche avant" /> pour reculer ou avancer d'une étape dans le temps.

Ouvrez le menu déroulant du délai pour choisir le délai d’animation du curseur. Certaines couches peuvent avoir besoin d’un délai plus important pour s’afficher correctement sur la carte.

Le champ visé par le filtre s’affiche en bas à gauche de la section du curseur temporel. Des descriptions personnalisées peuvent aussi s’afficher au même endroit.

=2!chart=

<a id="chartSection"></a>

## <img src="{{assetsURL}}/img/guide/footer/chart_30.svg" alt="Icône graphique" /> Graphique <a href="#footerSection">Haut de page</a>

_**N.B. : Il faut sélectionner un élément sur la carte pour que la couche devienne cliquable dans la liste, sans quoi elle sera désactivée (grisée).**_

L’onglet **Graphique** dans le pied de page se divise en deux sections. La liste des couches comportant un graphique se trouve dans la section de gauche. Sélectionnez un élément sur la carte pour en voir le graphique dans la section de droite.

Le menu déroulant **Élément** (en haut à gauche de la section du graphique) permet également de sélectionner un élément. Il s’agit d’une fonction pratique lorsque plusieurs éléments sont rapprochés sur la carte et qu’il est difficile de sélectionner celui voulu.

Vous pouvez cocher ou décocher les cases <img src="{{assetsURL}}/img/guide/layers/check.png" alt="Une icône représentant la fonction Case à cocher" /> des données au-dessus du graphique pour déterminer le contenu de celui-ci (seulement pour les couches comportant plusieurs éléments de données).

Ouvrez le menu déroulant de **téléchargement** (en haut à droite de la section du graphique) pour télécharger les données du graphique en format JSON. Cliquez sur **Télécharger tout** ou **Télécharger visible** selon que vous voulez télécharger toutes les données ou seulement celles actuellement visibles sur le graphique.

=3!chartTypes=

### Types de graphiques possibles :

- Graphiques linéaires
- Graphiques à barres
- Graphiques circulaires

Tous les graphiques sont alimentés par [Chart.js](https://www.chartjs.org/docs/latest/).

=3!chartControls=

### Commandes de graphique (si configurées) :

**Sélecteur de marches** : Les points des graphiques linéaires peuvent être affichés sous forme de marches en sélectionnant dans le menu déroulant **Marches**. Types de marches disponibles :

- **before** (avant) : La marche se produit avant le point de données
- **after** (après) : La marche se produit après le point de données
- **middle** (milieu) : La marche est centrée sur le point de données

**Sélecteur d'échelles** : L'échelle du graphique peut être modifiée en sélectionnant dans le menu déroulant **Échelle**. Les types d'échelles disponibles dépendent de la configuration de la source de données du graphique :

- **linear** (linéaire) : Échelle linéaire standard
- **logarithmic** (logarithmique) : Échelle logarithmique pour les données couvrant plusieurs ordres de grandeur
- **category** (catégorie) : Échelle catégorique pour les valeurs discrètes
- **time** (temps) : Échelle temporelle pour les données temporelles
- **timeseries** (série chronologique) : Échelle de série chronologique avec des fonctionnalités temporelles supplémentaires

**Verrouiller/Déverrouiller** - Verrouille les paramètres actuels du graphique (valeurs des curseurs, éléments de légende sélectionnés) pour éviter qu'ils ne soient réinitialisés lors du changement de graphique. Lorsqu'ils sont verrouillés, ces paramètres persistent lors des changements de graphique.

_**N.B. :** Si le nouveau graphique sélectionné ne contient pas de données correspondant aux valeurs verrouillées, le graphique peut apparaître vide. Le verrouillage est plus utile lorsque vous travaillez avec plusieurs graphiques qui partagent des éléments de légende, des plages de valeurs et des périodes communs._

Cliquez et déplacez les points sur la barre de curseur du graphique linéaire pour modifier les valeurs des axes X ou Y.

=1!issues=

# Temps de chargement / comportement imprévu

Le temps de chargement dépend :

- de l’emplacement du réseau;
- de la bande passante disponible;
- du nombre de couches en chargement;
- du type de couche et de sa taille.

Vous pourriez observer un comportement imprévu de la carte si vous interagissez avec celle-ci avant que les données ne soient complètement chargées. Veuillez laisser la carte se charger entièrement avant d’en utiliser les fonctions.
