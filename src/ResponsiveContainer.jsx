import useDimensions from "./useDimensions";
 
/**
 * ResponsiveContainer
 * Uses useDimensions to measure itself, then injects width + height
 * into its child. Extra props are forwarded via ...rest.
 *
 * Usage:
 *   <ResponsiveContainer height={400}>
 *     <BarChart data={data} margin={...} />
 *   </ResponsiveContainer>
 */
export default function ResponsiveContainer({ children, height = 400, className = "", style = {}, ...rest }) {
  const [ref, { width }] = useDimensions();
 
  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height, position: "relative", ...style }}
    >
      {width > 0 && (
        <children.type
          {...children.props}  // child's own props
          {...rest}            // forwarded props from parent
          width={width}        // measured width
          height={height}      // fixed height from prop
        />
      )}
    </div>
  );
}
 