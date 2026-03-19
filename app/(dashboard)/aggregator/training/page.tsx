"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GraduationCap, PlayCircle, FileText, Download, ExternalLink } from 'lucide-react'

export default function TrainingAndResourcesPage() {
  const BROCHURES = [
    { title: "Personal Loan", fileName: "/brochures/personal-loan-proposal.pdf" },
    { title: "Business Loan", fileName: "/brochures/business-loan-proposal.pdf" },
    { title: "Doctor Loan", fileName: "/brochures/doctor-loan-proposal.pdf" },
    { title: "CA Loan", fileName: "/brochures/ca-proposal-F2.pdf" },
    { title: "Home Loan", fileName: "/brochures/home-loan-full-proposal.pdf" },
    { title: "LAP(Loan Against Property) Loan", fileName: "/brochures/loan-against-property.pdf" },
  ];

  return (
    <div className="space-y-8 animate-in mt-2 fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
          <GraduationCap className="w-8 h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Training & Resources</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Access platform tutorials and download product brochures to maximize your business.
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {/* Video Tutorial Card */}
        <Card className="professional-card border-border shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <PlayCircle className="w-5 h-5 text-blue-500" />
              <CardTitle className="text-xl text-foreground">Platform Tutorial</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Watch our comprehensive video guide to learn how to generate applications, track commissions, and manage your pipeline efficiently on LendGrid.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-end">
            <div className="aspect-video bg-muted/30 border border-border rounded-lg mb-6 overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src="http://?fr"
                title="Platform Tutorial Video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full object-cover"
              ></iframe>
            </div>
            <Button className="w-full gap-2 transition-transform active:scale-95" variant="default" asChild>
              <a href="http://?2e" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Watch In Full Screen
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Product Brochures Card */}
        <Card className="professional-card border-border shadow-sm flex flex-col">
          <CardHeader>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-orange-500" />
              <CardTitle className="text-xl text-foreground">Product Brochures</CardTitle>
            </div>
            <CardDescription className="text-muted-foreground">
              Download the latest product policies, eligibility frameworks, and document checklists for different loan products.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="space-y-3 mt-2 flex-1">
              {BROCHURES.map((doc, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border bg-card/50 hover:bg-accent/30 transition-colors gap-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 p-1.5 bg-orange-500/10 rounded-md">
                      <FileText className="w-4 h-4 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {doc.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF Document
                      </p>
                    </div>
                  </div>
                  <Button asChild size="sm" variant="outline" className="gap-2 shrink-0 self-start sm:self-auto hover:bg-primary hover:text-primary-foreground">
                    <a href={doc.fileName} download={doc.fileName.split('/').pop()} target="_blank" rel="noopener noreferrer">
                      <Download className="w-4 h-4" />
                      Download
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
