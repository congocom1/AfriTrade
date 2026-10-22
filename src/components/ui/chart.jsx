"use client";
import * as React from "react"
import * as RechartsPrimitive from "recharts"

import { cn } from "@/lib/utils"

// Format: { THEME_NAME: CSS_SELECTOR }
const THEMES = {
  light: "",
  dark: ".dark"
}

const ChartContext = React.createContext(null)

function useChart() {
  const context = React.useContext(ChartContext)

  if (!context) {
    throw new Error("useChart must be used within a <ChartContainer />")
  }

  return context
}

const ChartContainer = React.forwardRef(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`

  return (
    (<ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          "flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_line]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_line]:stroke-border [&_.recharts-sector]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none",
          className
        )}
        {...props}>
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer>
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>)
  );
})
ChartContainer.displayName = "Chart"

const ChartStyle = ({
  id,
  config
}) => {
  const colorConfig = Object.entries(config).filter(([, config]) => config.theme || config.color)

  if (!colorConfig.length) {
    return null
  }

  return (
    (<style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) => `
${prefix} [data-chart=${id}] {
${colorConfig
.map(([key, itemConfig]) => {
const color =
  itemConfig.theme?.[theme] ||
  itemConfig.color
return color ? `  --color-${key}: ${color};` : null
})
.join("\n")}
}
`)
          .join("\n"),
      }} />)
  );
}

const ChartTooltip = RechartsPrimitive.Tooltip

const ChartTooltipContent = React.forwardRef((
  {
    active,
    payload,
    className,
    indicator = "dot",
    _hideLabel = false,
    _hideIndicator = false,
    _label,
    _labelFormatter,
    _labelClassName,
    _formatter,
    _color,
    _nameKey,
    _labelKey,
  },
  ref
) => {
  const { config } = useChart()

  if (!active || !payload?.length) {
    return null
  }

  return (
    (<div
      ref={ref}
      className={cn(
        "pointer-events-none z-10 flex max-w-xs flex-col rounded-lg border border-border bg-background p-2.5 shadow-lg",
        className
      )}
    >
      {payload.map((item, index) => {
        const key = `${_nameKey || item.dataKey || item.name || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)
        const indicatorColor = itemConfig?.color || item.color || item.payload?.fill || "hsl(var(--primary))"

        return (
          (<div key={index} className="flex items-center gap-1.5">
            <div
              className={cn(
                "flex h-1.5 w-1.5 shrink-0 rounded-full",
                indicator === "dot" ? "rounded-full" : "rounded-[2px]",
                indicator === "dashed" && "border-dashed"
              )}
              style={{
                backgroundColor: indicatorColor,
                borderColor: indicatorColor
              }}
            />
            {indicator === "dot" && (
              <div
                className="flex h-2.5 w-2.5 shrink-0 items-center justify-center rounded-full"
                style={{
                  borderColor: indicatorColor,
                  borderWidth: 2
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: indicatorColor,
                  }}
                />
              </div>
            )}
            {indicator === "line" && (
              <div
                className="flex h-4 w-4 shrink-0 items-center justify-center"
                style={{
                  borderColor: indicatorColor,
                  borderWidth: 2,
                  borderStyle: "dashed"
                }}
              >
                <div
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: indicatorColor,
                  }}
                />
              </div>
            )}
            <div
              className={cn(
                "flex flex-1 justify-between leading-none",
                "items-center"
              )}
            >
              <div className="grid gap-1.5">
                <span className="text-muted-foreground">
                  {itemConfig?.label || item.name}
                </span>
              </div>
              {item.value && (
                <span className="font-mono font-medium tabular-nums text-foreground">
                  {item.value.toLocaleString()}
                </span>
              )}
            </div>
          </div>)
        );
      })}
    </div>)
  );
})
ChartTooltipContent.displayName = "ChartTooltip"

const ChartLegend = RechartsPrimitive.Legend

const ChartLegendContent = React.forwardRef((
  { className, hideIcon = false, payload, verticalAlign = "bottom", nameKey },
  ref
) => {
  const { config } = useChart()

  if (!payload?.length) {
    return null
  }

  return (
    (<div
      ref={ref}
      className={cn(
        "flex items-center justify-center gap-4",
        verticalAlign === "top" ? "pb-3" : "pt-3",
        className
      )}>
      {payload.map((item) => {
        const key = `${nameKey || item.dataKey || "value"}`
        const itemConfig = getPayloadConfigFromPayload(config, item, key)

        return (
          (<div
            key={item.value}
            className={cn(
              "flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            )}>
            {itemConfig?.icon && !hideIcon ? (
              <itemConfig.icon />
            ) : (
              <div
                className="h-2 w-2 shrink-0 rounded-[2px]"
                style={{
                  backgroundColor: item.color,
                }}
              />
            )}
            {itemConfig?.label}
          </div>)
        );
      })}
    </div>)
  );
})
ChartLegendContent.displayName = "ChartLegend"

// Helper to extract item config from a payload.
function getPayloadConfigFromPayload(
  config,
  payload,
  key
) {
  if (typeof payload !== "object" || payload === null) {
    return undefined
  }

  const payloadPayload =
    "payload" in payload &&
    typeof payload.payload === "object" &&
    payload.payload !== null
      ? payload.payload
      : undefined

  let configLabelKey = key

  if (
    key in payload &&
    typeof payload[key] === "string"
  ) {
    configLabelKey = payload[key]
  } else if (
    payloadPayload &&
    key in payloadPayload &&
    typeof payloadPayload[key] === "string"
  ) {
    configLabelKey = payloadPayload[key]
  }

  return configLabelKey in config
    ? config[configLabelKey]
    : config[key];
}

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}