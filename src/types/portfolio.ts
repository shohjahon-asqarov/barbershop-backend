// Portfolio item structure
export interface PortfolioItem {
  id: string;
  image: string; // base64 or URL
  title: string; // max 100 chars
  description?: string; // max 500 chars, optional
  category?: string; // e.g., "Fade", "Beard", "Haircut", optional
  createdAt?: string; // ISO date string
}

// Portfolio operations
export interface AddPortfolioRequest {
  items: Array<{
    image: string;
    title: string;
    description?: string;
    category?: string;
  }>;
}

export interface UpdatePortfolioItemRequest {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  image?: string;
}

export interface RemovePortfolioRequest {
  id: string;
}

