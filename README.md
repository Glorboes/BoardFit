# BoardFit

Woodworking sheet cutting planner. Default stock: 2470 × 1800 mm. Enter piece dimensions and quantities, blade allowance and rotation preference to calculate visual layouts and estimated sheet requirements. Cut lists are saved only in the browser.

## GitHub Pages
In Settings → Pages, select Deploy from a branch, main, / (root), and Save. Hosting from a private repository requires an eligible GitHub plan; the Pages website is generally public.

## Development
The modular source is in dist/. The root index.html is the standalone application. Run npm test for packing tests.

Layouts use a straight-cut packing heuristic, not a guaranteed mathematical minimum. Blade spacing is included; edge trimming is not.
