use aiken/builtin
use aiken/list
use aiken/transaction.{Input, ScriptContext, Spend}

pub fn get_own_input(ctx: ScriptContext) -> Input {
  expect Spend(output_reference) = ctx.purpose
  expect Some(input) =
    list.find(
      ctx.transaction.inputs,
      fn(input) { input.output_reference == output_reference },
    )
  input
}

pub fn expect_unique(list: List<x>) -> x {
  if builtin.null_list(builtin.tail_list(list)) {
    builtin.head_list(list)
  } else {
    fail
  }
}
