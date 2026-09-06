import { HourlyRateForm } from "@/components/HourlyRateForm";
import { requireAuth } from "@/lib/require-auth";
import { getHourlyRate } from "./settings-actions";



export default async function SettingsPage() {
    await requireAuth();
    const currentRate = await getHourlyRate();

    return (
        <main className="max-w-2xl mx-auto px-4 py-10">
            <h1 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-gray-100">
                Paramètres
            </h1>

            <section className="mb-8">
                <h2 className="text-lg font-medium mb-2 text-gray-900 dark:text-gray-100">
                    Taux horaire
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Ce taux est utilisé pour estimer ton salaire à partir de tes vacations.
                    Modifie-le manuellement si besoin (ex. évolution du SMIC).
                </p>
                <HourlyRateForm initialRate={currentRate} />
            </section>
        </main>
    )
}
