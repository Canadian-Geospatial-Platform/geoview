/// <reference types="react" />
/**
 * Interface used for home button properties
 */
interface HomeProps {
    className?: string | undefined;
    iconClassName?: string | undefined;
}
/**
 * Create a home button to return the user to the map center
 *
 * @param {HomeProps} props the home button properties
 * @returns {JSX.Element} the created home button
 */
declare function Home(props: HomeProps): JSX.Element;
declare namespace Home {
    var defaultProps: {
        className: string;
        iconClassName: string;
    };
}
export default Home;
