declare module "pdfmake/interfaces" {
  type Margins = number | [number, number, number, number];

  export interface TDocumentDefinitions {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    content?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    styles?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    defaultStyle?: Record<string, any>;
    pageMargins?: Margins;
    pageSize?:
      | string
      | {
          width: number;
          height: number;
        };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    info?: Record<string, any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    footer?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    header?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    background?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
  }
}
