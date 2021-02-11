import React, { useEffect, useState } from 'react';

/**
 * A panel content plugin that will list existing vectors or listen to newely added ones
 *
 * @param {*} props optional properties
 */
const PanelContent = (props) => {
    const [vectors, setVectors] = useState({});

    // get a reference to the viewer api
    const { cgpv } = window;

    // get the mapId passed in when loading the component
    const { mapId } = props;

    /**
     * Delete a vector from the map and from the panel content vector list
     *
     * @param {string} id the id of vector to delete
     */
    const deleteVector = (id) => {
        cgpv.api.map(mapId).deleteGeometry(id);

        setVectors(
            Object.assign(
                {},
                Object.values(vectors).filter((vector) => vector.id !== id)
            )
        );
    };

    /**
     * get a list of all added layers and add them to the panel content
     */
    useEffect(() => {
        // load existing vectors
        const { layers } = cgpv.api.map(mapId);

        const prevVectors = {};

        // loop each vector and add it to the panel vector list
        layers.forEach((vector) => {
            const { id } = vector;

            prevVectors[id] = {
                id: vector.id,
                layer: vector.layer,
                type: vector.type,
                mapId: vector.handlerName,
            };
        });

        setVectors(prevVectors);
    }, []);

    /**
     * listen to newely added vectors and add them to the panel vector list
     */
    useEffect(() => {
        // listen to newely added vectors
        cgpv.api.on('vector/added', (payload) => {
            const { id } = payload;

            setVectors({
                ...vectors,
                [id]: {
                    id: payload.id,
                    layer: payload.layer,
                    type: payload.type,
                    mapId: payload.handlerName,
                },
            });
        });

        return () => {
            cgpv.api.off('vector/added');
        };
    });

    return (
        <div>
            {Object.keys(vectors).map((key) => {
                const vector = vectors[key];
                return (
                    <div key={vector.id}>
                        <p>Vector ID: {vector.id}</p>
                        <p>Vector Type: {vector.type}</p>
                        <button type="button" onClick={() => deleteVector(vector.id)}>
                            Delete vector
                        </button>
                    </div>
                );
            })}
        </div>
    );
};

export default PanelContent;
