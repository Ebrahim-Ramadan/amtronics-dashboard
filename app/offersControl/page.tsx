"use client";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Topleftmenu from "@/components/top-left-menu";
import { Edit, Loader, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import LoadingDots from "@/components/ui/loading-dots";
const initialForm = {
  offerText: "",
  offerDescription: "",
  ar_offerText: "",
  ar_offerDescription: "",
};

function isEnglish(text: string) {
  return /^[A-Za-z0-9\s.,!?"'()-]+$/.test(text.trim());
}
function isArabic(text: string) {
  return /^[\u0600-\u06FF\s]+$/.test(text.trim());
}

function trimBeforeArabic(text: string) {
  const match = text.match(/[\u0600-\u06FF].*$/);
  return match ? match[0].trim() : "";
}

function trimAllFields(obj: typeof initialForm) {
  return {
    offerText: obj.offerText.trim(),
    offerDescription: obj.offerDescription.trim(),
    ar_offerText: trimBeforeArabic(obj.ar_offerText),
    ar_offerDescription: trimBeforeArabic(obj.ar_offerDescription),
  };
}

export default function Home() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeOfferId, setActiveOfferId] = useState<string | null>(null);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchOffers();
  }, []);

 async function fetchOffers() {
    setLoading(true);
    try {
      const res = await fetch("/api/offers");
      const data = await res.json();
      let offersArr = data.offers || [];
      // Sort so active offer is first
      offersArr = offersArr.sort((a: any, b: any) => (b.active ? 1 : 0) - (a.active ? 1 : 0));
      setOffers(offersArr);
      const active = offersArr.find((o: any) => o.active);
      setActiveOfferId(active?._id || null);
    } catch (err) {
      toast.error("Failed to fetch offers.");
    }
    setLoading(false);
  }

  async function setActiveOffer(id: string) {
    setLoading(true);
    try {
      await fetch("/api/offers/activate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success("Offer set as active.");
      await fetchOffers();
    } catch (err) {
      toast.error("Failed to set offer as active.");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    setLoading(true);
    try {
      await fetch("/api/offers", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      toast.success("Offer deleted.");
      await fetchOffers();
    } catch (err) {
      toast.error("Failed to delete offer.");
    }
  }

   async function handleAddOrEdit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const trimmed = trimAllFields(form);
    if (
      !trimmed.offerText ||
      !trimmed.offerDescription ||
      !trimmed.ar_offerText ||
      !trimmed.ar_offerDescription
    ) {
      toast.error("All fields are required.");
      setLoading(false);
      return;
    }
    if (!isEnglish(trimmed.offerText) || !isEnglish(trimmed.offerDescription)) {
      toast.error("English fields must contain only English text.");
      setLoading(false);
      return;
    }
    if (!isArabic(trimmed.ar_offerText) || !isArabic(trimmed.ar_offerDescription)) {
      toast.error("Arabic fields must contain only Arabic text.");
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        await fetch("/api/offers", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editingId, ...trimmed }),
        });
        toast.success("Offer updated.");
      } else {
        await fetch("/api/offers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(trimmed),
        });
        toast.success("Offer added.");
      }
      setForm(initialForm);
      setEditingId(null);
      await fetchOffers();
    } catch (err) {
      toast.error("Failed to save offer.");
    }
  }

  function handleEdit(offer: any) {
    setEditingId(offer._id);
    setForm({
      offerText: offer.offerText,
      offerDescription: offer.offerDescription,
      ar_offerText: offer.ar_offerText,
      ar_offerDescription: offer.ar_offerDescription,
    });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(initialForm);
  }

  return (
    <div className="min-h-screen bg-gray-50 p-2 md:p-6">
      <div className="w-full mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 text-xl font-bold md:gap-4">
          <Topleftmenu />
          Offers
        </div>

        {/* Add/Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>{editingId ? "Edit Offer" : "New Offer"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-2" onSubmit={handleAddOrEdit}>
              <input
                className="border rounded px-2 py-1"
                placeholder="Offer Text"
                value={form.offerText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, offerText: e.target.value }))
                }
                required
              />
              <input
                className="border rounded px-2 py-1"
                placeholder="Offer Description"
                value={form.offerDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, offerDescription: e.target.value }))
                }
                required
              />
              <input
                className="border rounded px-2 py-1"
                placeholder="Arabic Offer Text"
                value={form.ar_offerText}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ar_offerText: e.target.value }))
                }
                required
                style={{ direction: "rtl" }}
              />
              <input
                className="border rounded px-2 py-1"
                placeholder="Arabic Offer Description"
                value={form.ar_offerDescription}
                onChange={(e) =>
                  setForm((f) => ({ ...f, ar_offerDescription: e.target.value }))
                }
                required
                style={{ direction: "rtl" }}
              />
              <div className="flex gap-2 justify-end">
                <Button type="submit" size="sm" disabled={loading}>
                  {editingId ? "Update" : "Add"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Offers List */}
        <Card className="space-y-0 gap-0">
                 <p className="font-bold text-xl px-4">
                  Offers List
                 </p>
            {loading && <div className="flex justify-center items-center w-full">
              <LoadingDots/>
              </div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
            { !loading && offers.map((offer: any) => (
              <div
                key={offer._id}
                className={`pt-10 my-2 border-2 rounded-xl p-3 mb-2 flex flex-col gap-2 relative ${offer.active ? 'border-green-500/10 bg-green-100/20 shadow-sm' : 'border-neutral-100'}`}
              >
                <div className="line-clamp-2">
                  <strong>Offer Text:</strong> {offer.offerText}
                </div>
                <div className="line-clamp-3">
                  <strong>Description:</strong> {offer.offerDescription}
                </div>
                <div className="line-clamp-2">
                  <strong>Arabic Text:</strong>{" "}
                  {isArabic(trimBeforeArabic(offer.ar_offerText))
                    ? trimBeforeArabic(offer.ar_offerText)
                    : <span className="text-red-600">Not Arabic</span>}
                </div>
                <div className="line-clamp-4">
                  <strong>Arabic Description:</strong>{" "}
                  {isArabic(trimBeforeArabic(offer.ar_offerDescription))
                    ? trimBeforeArabic(offer.ar_offerDescription)
                    : <span className="text-red-600">Not Arabic</span>}
                </div>
                <div className="absolute top-3 right-3">
                  {offer.active ? (
                    <span className="text-green-600 font-bold bg-green-100 text-xs px-2 py-1 rounded-full"
                     title="Showing on website top promotional header">Active ⓘ</span>
                  ) : (
                    <span className="text-gray-500 bg-gray-100 text-xs px-2 py-1 rounded-full">Inactive</span>
                  )}
                </div>
                <div className="flex gap-2 justify-end">
                  {!offer.active && (
                    <Button
                      size="sm"
                      onClick={() => setActiveOffer(offer._id)}
                      disabled={loading}
                    >
                      Set Active
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(offer)}
                    disabled={loading}
                  >
                    <Edit/>
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(offer._id)}
                    disabled={loading}
                  >
                    <Trash2/>
                  </Button>
                </div>
              </div>
            ))}
            {offers.length === 0 && !loading && <div>No offers found.</div>}
          </div>
        </Card>
      </div>
    </div>
  );
}