import { useEffect } from "react";

//  cursor change on hover 
export function useCursor(hovered: boolean) {
  useEffect(() => {
    if (hovered) {
      document.body.style.cursor = "pointer";
    } else {
      document.body.style.cursor = "auto";
    }
  }, [hovered]);
}