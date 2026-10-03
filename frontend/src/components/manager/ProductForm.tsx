import { useState } from "react";
import type { FormEvent } from "react";
import type {
  PackageOption,
  ProductPayload
} from "../../services/productService";

interface ProductFormProps {
  initialData?: ProductPayload;
  onSubmit: (data: ProductPayload) => Promise<void>;
  onCancel: () => void;
  submitText?: string;
}

const emptyPackage: PackageOption = {
  weight: 500,
  unit: "g",
  price: 0
};

const ProductForm = ({
  initialData,
  onSubmit,
  onCancel,
  submitText = "Create Product"
}: ProductFormProps) => {

  const [form, setForm] =
    useState<ProductPayload>(
      initialData || {
        name: "",
        category: "fish",
        description: "",
        packageOptions: [
          {
            ...emptyPackage
          }
        ],
        stock: 0,
        stockUnit: "kg",
        image: "",
        isAvailable: true,
        isFeatured: false
      }
    );

  const [saving, setSaving] =
    useState(false);

  const updateField = <Field extends keyof ProductPayload,>(
    field: Field,
    value: ProductPayload[Field]
  ) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }));
  };

  const updatePackage = (
    index: number,
    field: keyof PackageOption,
    value: string | number
  ) => {
    setForm((previous) => {

      const packages = [
        ...previous.packageOptions
      ];

      packages[index] = {
        ...packages[index],
        [field]:
          field === "price" ||
          field === "weight"
            ? Number(value)
            : value
      };

      return {
        ...previous,
        packageOptions: packages
      };
    });
  };

  const addPackage = () => {
    setForm((previous) => ({
      ...previous,
      packageOptions: [
        ...previous.packageOptions,
        {
          weight: 1,
          unit: "kg",
          price: 0
        }
      ]
    }));
  };

  const removePackage = (
    index: number
  ) => {
    setForm((previous) => ({
      ...previous,
      packageOptions:
        previous.packageOptions.filter(
          (_, i) => i !== index
        )
    }));
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!form.name.trim()) {
      alert("Product name is required");
      return;
    }

    if (!form.description.trim()) {
      alert("Product description is required");
      return;
    }

    if (form.packageOptions.length === 0) {
      alert("Add at least one package");
      return;
    }

    setSaving(true);

    try {
      await onSubmit(form);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="product-form"
      onSubmit={handleSubmit}
    >

      <h2>
        {submitText === "Create Product"
          ? "Add Product"
          : "Edit Product"}
      </h2>

      {/* Product Name */}

      <div className="form-group">
        <label>
          Product Name
        </label>

        <input
          type="text"
          value={form.name}
          placeholder="Example: Rohu Curry Cut"
          onChange={(e) =>
            updateField(
              "name",
              e.target.value
            )
          }
        />
      </div>

      {/* Category */}

      <div className="form-group">
        <label>
          Category
        </label>

        <select
          value={form.category}
          onChange={(e) =>
            updateField(
              "category",
              e.target.value as ProductPayload["category"]
            )
          }
        >
          <option value="fish">
            Fish
          </option>

          <option value="chicken">
            Chicken
          </option>
        </select>
      </div>

      {/* Description */}

      <div className="form-group">
        <label>
          Description
        </label>

        <textarea
          value={form.description}
          placeholder="Describe the product..."
          rows={4}
          onChange={(e) =>
            updateField(
              "description",
              e.target.value
            )
          }
        />
      </div>

      {/* Image */}

      <div className="form-group">
        <label>
          Product Image URL
        </label>

        <input
          type="text"
          value={form.image}
          placeholder="https://..."
          onChange={(e) =>
            updateField(
              "image",
              e.target.value
            )
          }
        />
      </div>

      {/* Stock */}

      <div className="form-row">

        <div className="form-group">
          <label>
            Stock
          </label>

          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) =>
              updateField(
                "stock",
                Number(e.target.value)
              )
            }
          />
        </div>

        <div className="form-group">
          <label>
            Stock Unit
          </label>

          <select
            value={form.stockUnit}
            onChange={(e) =>
              updateField(
                "stockUnit",
                e.target.value as ProductPayload["stockUnit"]
              )
            }
          >
            <option value="kg">
              Kilogram
            </option>

            <option value="g">
              Gram
            </option>
          </select>
        </div>

      </div>

      {/* Packages */}

      <div className="packages-section">

        <div className="section-header">
          <h3>
            Package Options
          </h3>

          <button
            type="button"
            onClick={addPackage}
          >
            + Add Package
          </button>
        </div>

        {form.packageOptions.map(
          (pkg, index) => (

            <div
              className="package-row"
              key={index}
            >

              <input
                type="number"
                min="1"
                value={pkg.weight}
                onChange={(e) =>
                  updatePackage(
                    index,
                    "weight",
                    e.target.value
                  )
                }
              />

              <select
                value={pkg.unit}
                onChange={(e) =>
                  updatePackage(
                    index,
                    "unit",
                    e.target.value
                  )
                }
              >
                <option value="g">
                  g
                </option>

                <option value="kg">
                  kg
                </option>
              </select>

              <div className="price-input">
                <span>₹</span>

                <input
                  type="number"
                  min="0"
                  value={pkg.price}
                  onChange={(e) =>
                    updatePackage(
                      index,
                      "price",
                      e.target.value
                    )
                  }
                />
              </div>

              {form.packageOptions.length >
                1 && (
                <button
                  type="button"
                  onClick={() =>
                    removePackage(index)
                  }
                >
                  Remove
                </button>
              )}

            </div>
          )
        )}

      </div>

      {/* Options */}

      <div className="checkbox-group">

        <label>
          <input
            type="checkbox"
            checked={form.isAvailable}
            onChange={(e) =>
              updateField(
                "isAvailable",
                e.target.checked
              )
            }
          />

          Available for customers
        </label>

        <label>
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(e) =>
              updateField(
                "isFeatured",
                e.target.checked
              )
            }
          />

          Featured Product
        </label>

      </div>

      {/* Actions */}

      <div className="form-actions">

        <button
          type="button"
          onClick={onCancel}
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
        >
          {saving
            ? "Saving..."
            : submitText}
        </button>

      </div>

    </form>
  );
};

export default ProductForm;