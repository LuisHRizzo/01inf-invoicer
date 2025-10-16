declare module "pdfmake/interfaces" {
  type Margins = number | [number, number, number, number];

  export interface TDocumentDefinitions {
    content?: any;
    styles?: Record<string, any>;
    defaultStyle?: Record<string, any>;
    pageMargins?: Margins;
    pageSize?:
      | string
      | {
          width: number;
          height: number;
        };
    info?: Record<string, any>;
    footer?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
    header?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
    background?:
      | any
      | ((
          currentPage: number,
          pageCount: number,
          pageSize: { width: number; height: number; orientation?: "portrait" | "landscape" }
        ) => any);
  }
}
