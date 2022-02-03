import React from 'react';
import renderer from 'react-test-renderer';
import TopContent from '../src/components/TopContent';

test('Check the content', () => {
    const component = renderer.create(<TopContent title="Title" subtitle="Subtitle" text="Text" />);
    const instance = component.root;
    expect(instance.findByProps({ className: 'hero-title' }).children).toEqual(['Starter React Flux']);
    expect(instance.findByProps({ className: 'hero-subtitle' }).children).toEqual(['Superfast React development tool']);
});

test('Snapshot testing', () => {
    // const component = renderer.create(
    //   <TopContent title="Title" subtitle="Subtitle" text="Text" />
    // );
    // expect(component.toJSON()).toMatchSnapshot();
});
