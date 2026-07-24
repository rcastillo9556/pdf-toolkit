import { PDFTextField, PDFCheckBox, PDFRadioGroup, PDFDropdown } from 'pdf-lib'
import { loadPdf } from './loadPdf'

export type FieldDescriptor =
  | { kind: 'text'; name: string; value: string }
  | { kind: 'checkbox'; name: string; checked: boolean }
  | { kind: 'radio'; name: string; options: string[]; selected: string }
  | { kind: 'dropdown'; name: string; options: string[]; selected: string }

export async function detectFormFields(bytes: Uint8Array): Promise<FieldDescriptor[]> {
  const pdfDoc = await loadPdf(bytes)
  const form = pdfDoc.getForm()
  const out: FieldDescriptor[] = []
  for (const field of form.getFields()) {
    const name = field.getName()
    if (field instanceof PDFTextField) {
      out.push({ kind: 'text', name, value: field.getText() ?? '' })
    } else if (field instanceof PDFCheckBox) {
      out.push({ kind: 'checkbox', name, checked: field.isChecked() })
    } else if (field instanceof PDFRadioGroup) {
      out.push({ kind: 'radio', name, options: field.getOptions(), selected: field.getSelected() ?? '' })
    } else if (field instanceof PDFDropdown) {
      out.push({ kind: 'dropdown', name, options: field.getOptions(), selected: field.getSelected()[0] ?? '' })
    }
  }
  return out
}

export async function fillFormFields(
  bytes: Uint8Array,
  values: FieldDescriptor[],
  flatten: boolean,
): Promise<Uint8Array> {
  const pdfDoc = await loadPdf(bytes)
  const form = pdfDoc.getForm()
  for (const v of values) {
    try {
      if (v.kind === 'text') {
        form.getTextField(v.name).setText(v.value)
      } else if (v.kind === 'checkbox') {
        const cb = form.getCheckBox(v.name)
        if (v.checked) cb.check()
        else cb.uncheck()
      } else if (v.kind === 'radio') {
        if (v.selected) form.getRadioGroup(v.name).select(v.selected)
      } else if (v.kind === 'dropdown') {
        if (v.selected) form.getDropdown(v.name).select(v.selected)
      }
    } catch (e) {
      console.warn(`No se pudo aplicar el campo "${v.name}"`, e)
    }
  }
  if (flatten) form.flatten()
  return pdfDoc.save()
}
