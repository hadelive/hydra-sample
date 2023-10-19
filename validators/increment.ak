use aiken/list
use aiken/transaction.{InlineDatum, Input, Output, ScriptContext}
use hydrasample/utils.{get_own_input}

type Datum {
  id: Int,
}

validator {
  fn increment(datum: Datum, _r: Data, ctx: ScriptContext) -> Bool {
    let own_input = get_own_input(ctx)
    let Input { output: Output { address: own_address, .. }, .. } = own_input
    expect [own_output] =
      list.filter(
        ctx.transaction.outputs,
        fn(out) { out.address == own_address },
      )
    expect InlineDatum(own_output_data) = own_output.datum
    expect own_output_datum: Datum = own_output_data
    datum.id + 1 == own_output_datum.id
  }
}
